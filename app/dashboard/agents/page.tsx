import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function AgentsPage() {
  const session = await auth();
  const agencyId = (session?.user as any)?.agencyId;

  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { aiSystemPrompt: true },
  });

  async function saveConfigAction(formData: FormData) {
    "use server";
    const userSession = await auth();
    const aid = (userSession?.user as any)?.agencyId;
    if (!aid) return;

    const aiSystemPrompt = formData.get("aiSystemPrompt") as string;

    await prisma.agency.update({
      where: { id: aid },
      data: { aiSystemPrompt },
    });
    
    revalidatePath("/dashboard/agents");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Configuración del Agente IA</h1>
      <p className="text-[#a3a3a3] mb-8">
        Personaliza el comportamiento y el tono de la inteligencia artificial que atenderá a tus clientes por WhatsApp.
      </p>

      <div className="card p-6">
        <form action={saveConfigAction} className="space-y-6">
          
          <div>
            <label className="label">Instrucciones del Sistema (System Prompt)</label>
            <textarea 
              name="aiSystemPrompt" 
              rows={8}
              required 
              className="input resize-none" 
              placeholder="Eres el mejor agente inmobiliario. Tu objetivo es precalificar a los clientes..."
              defaultValue={agency?.aiSystemPrompt || ""}
            ></textarea>
            <p className="text-xs text-[#737373] mt-2">
              El agente automáticamente tiene acceso a las herramientas de `searchCatalog` y `qualifyLead`. 
              Dile explícitamente cuándo usar cada una.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="btn btn-primary px-8">
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
