import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import prisma from "./prisma";

export async function runAgent(leadId: string, agencyId: string, message: string) {
  // 1. Obtener Agente Activo
  const agent = await prisma.agent.findFirst({
    where: { agencyId, isActive: true },
  });

  if (!agent || !agent.llmApiKey || !agent.llmModel) {
    console.warn(`[AI] No active agent configured for agency ${agencyId}`);
    return "Lo siento, en este momento no puedo procesar tu mensaje. Un asesor humano se contactará pronto.";
  }

  // 2. Obtener Lead y su Historial (últimos 10 mensajes)
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 10,
      }
    }
  });

  if (!lead) throw new Error("Lead not found");

  // 3. Configurar Proveedor LLM Dinámico
  let aiModel;
  switch (agent.llmProvider) {
    case "OPENAI":
      aiModel = createOpenAI({ apiKey: agent.llmApiKey })(agent.llmModel);
      break;
    case "ANTHROPIC":
      aiModel = createAnthropic({ apiKey: agent.llmApiKey })(agent.llmModel);
      break;
    case "GOOGLE":
      aiModel = createGoogleGenerativeAI({ apiKey: agent.llmApiKey })(agent.llmModel);
      break;
    default:
      throw new Error(`Provider ${agent.llmProvider} not supported`);
  }

  // 4. Preparar Mensajes (Formato Vercel AI SDK)
  const messages = lead.messages.map(msg => ({
    role: msg.role === "USER" ? "user" : "assistant",
    content: msg.content,
  })) as any[];
  
  // Agregar el mensaje actual si no está en el historial
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.content !== message) {
    messages.push({ role: "user", content: message });
  }

  const systemInstructions = agent.systemPrompt || "Eres un asistente virtual.";

  const searchCatalogSchema = z.object({
    query: z.string().describe("Término de búsqueda (ej. 'departamento centro', 'playa')"),
    maxPrice: z.number().optional().describe("Precio máximo"),
  });

  const qualifyLeadSchema = z.object({
    reason: z.string().describe("Razón por la cual se califica"),
    summary: z.string().describe("Resumen del perfil del cliente (presupuesto, necesidades)"),
  });

  // 5. Ejecutar LLM con Tools
  try {
    const { text, toolCalls } = await generateText({
      model: aiModel,
      system: systemInstructions,
      messages,
      tools: {
        searchCatalog: tool({
          description: "Busca propiedades o paquetes de viaje en el catálogo de la agencia.",
          parameters: searchCatalogSchema,
          // @ts-expect-error Type inference issue with Prisma return types and AI SDK
          execute: async (args: z.infer<typeof searchCatalogSchema>) => {
            const items = await prisma.catalogItem.findMany({
              where: {
                agencyId,
                isActive: true,
                OR: [
                  { title: { contains: args.query, mode: "insensitive" } },
                  { description: { contains: args.query, mode: "insensitive" } },
                  { location: { contains: args.query, mode: "insensitive" } },
                ],
                ...(args.maxPrice ? { price: { lte: args.maxPrice } } : {}),
              },
              take: 5,
            });
            return items;
          },
        }),
        qualifyLead: tool({
          description: "Marca al lead como CALIFICADO cuando muestra interés real y cumple perfil.",
          parameters: qualifyLeadSchema,
          // @ts-expect-error Type inference issue with Prisma return types and AI SDK
          execute: async (args: z.infer<typeof qualifyLeadSchema>) => {
            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                status: "QUALIFIED",
                aiSummary: args.summary,
                notes: args.reason,
              }
            });
            return { success: true, message: "Lead calificado exitosamente." };
          },
        })
      },
    });

    return text || "No tengo una respuesta en este momento.";
  } catch (error) {
    console.error("[AI] Error generation response", error);
    return "Ocurrió un error al procesar tu solicitud.";
  }
}
