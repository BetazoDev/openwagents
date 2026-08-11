import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOpenWAClient } from "@/lib/openwa";
import { runAgent } from "@/lib/ai-agent";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-api-key");
    const expectedSecret = process.env.OPENWA_WEBHOOK_SECRET;

    if (expectedSecret && authHeader !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
    }

    const payload = await req.json();

    // Event filter: we only care about new messages
    if (payload.event !== "message" || !payload.payload) {
      return NextResponse.json({ status: "ignored" });
    }

    const messageData = payload.payload;
    const sessionName = payload.session;
    
    // Ignore messages from ourselves or groups
    if (messageData.fromMe || messageData.from.includes("@g.us")) {
      return NextResponse.json({ status: "ignored" });
    }

    const senderPhone = messageData.from.replace("@c.us", "");
    const messageText = messageData.body;

    // 1. Encontrar la Agencia por Sesión
    const session = await prisma.whatsappSession.findUnique({
      where: { sessionName },
      include: { agency: true }
    });

    if (!session) {
      console.warn(`[Webhook] Session ${sessionName} not found in DB`);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 2. Upsert Lead
    const leadName = messageData._data?.notifyName || null;
    const lead = await prisma.lead.upsert({
      where: { 
        agencyId_phoneNumber: { 
          agencyId: session.agencyId, 
          phoneNumber: senderPhone 
        } 
      },
      update: {
        ...(leadName ? { name: leadName } : {})
      },
      create: {
        agencyId: session.agencyId,
        phoneNumber: senderPhone,
        name: leadName,
        status: "NEW",
      }
    });

    // 3. Guardar Mensaje del Usuario
    await prisma.messageHistory.create({
      data: {
        leadId: lead.id,
        role: "USER",
        content: messageText,
      }
    });

    // 4. Ejecutar Agente IA de forma asíncrona (no bloquea el webhook)
    // El servidor HTTP debe responder rápido, el agente procesa en background
    processAgentResponse(lead.id, session.agencyId, messageText, sessionName, senderPhone).catch(console.error);

    return NextResponse.json({ status: "received" });

  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function processAgentResponse(leadId: string, agencyId: string, text: string, sessionName: string, phone: string) {
  try {
    const aiResponse = await runAgent(leadId, agencyId, text);
    
    // Guardar respuesta del asistente
    await prisma.messageHistory.create({
      data: {
        leadId: leadId,
        role: "ASSISTANT",
        content: aiResponse,
      }
    });

    // Enviar por WhatsApp
    const openwa = getOpenWAClient();
    await openwa.sendText(sessionName, phone, aiResponse);
    
  } catch (error) {
    console.error(`[AgentProcess] Failed for lead ${leadId}:`, error);
  }
}
