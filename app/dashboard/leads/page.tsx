import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function LeadsPage() {
  const session = await auth();
  const agencyId = (session?.user as any)?.agencyId;

  const leads = await prisma.lead.findMany({
    where: { agencyId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  async function updateStatusAction(formData: FormData) {
    "use server";
    const userSession = await auth();
    const aid = (userSession?.user as any)?.agencyId;
    if (!aid) return;

    const leadId = formData.get("leadId") as string;
    const newStatus = formData.get("status") as any;

    await prisma.lead.updateMany({
      where: { id: leadId, agencyId: aid },
      data: { status: newStatus }
    });
    revalidatePath("/dashboard/leads");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Leads</h1>
        <p className="text-[#a3a3a3]">
          Visualiza a los prospectos captados por la Inteligencia Artificial desde WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {leads.length === 0 ? (
          <div className="card text-center py-12 border-dashed border-[#333]">
            <p className="text-[#a3a3a3]">No hay leads registrados aún.</p>
          </div>
        ) : (
          leads.map(lead => (
            <div key={lead.id} className="card p-6 border border-[#262626] flex flex-col md:flex-row gap-6">
              
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xl text-white">{lead.name || "Sin nombre"}</h3>
                    <p className="text-sm font-mono text-[#737373]">{lead.phoneNumber}</p>
                  </div>
                  <span className={`badge ${
                    lead.status === "QUALIFIED" ? "badge-success" : 
                    lead.status === "CONTACTED" ? "badge-warning" : "bg-blue-900 text-blue-100 border-transparent"
                  }`}>
                    {lead.status === "QUALIFIED" ? "Calificado por IA" : lead.status === "CONTACTED" ? "Contactado" : "Nuevo"}
                  </span>
                </div>
                
                {lead.aiSummary && (
                  <div className="bg-[#1a1a1a] p-3 rounded-md border border-[#333]">
                    <p className="text-xs font-semibold text-brand-400 mb-1">🧠 Resumen de la IA:</p>
                    <p className="text-sm text-[#d4d4d4]">{lead.aiSummary}</p>
                  </div>
                )}
                
                {lead.messages.length > 0 && (
                  <p className="text-sm text-[#737373] italic">
                    Último mensaje: "{lead.messages[0].content}"
                  </p>
                )}
              </div>

              <div className="md:w-48 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#333] pt-4 md:pt-0 md:pl-6">
                <form action={updateStatusAction} className="flex flex-col gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <label className="text-xs font-medium text-[#a3a3a3]">Cambiar Estado</label>
                  <select name="status" defaultValue={lead.status} className="input text-sm py-2">
                    <option value="NEW">Nuevo</option>
                    <option value="CONTACTED">Contactado</option>
                    <option value="QUALIFIED">Calificado</option>
                  </select>
                  <button type="submit" className="btn bg-[#333] hover:bg-[#444] text-white py-2 text-sm mt-1">
                    Actualizar
                  </button>
                </form>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
