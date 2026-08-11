import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const agencyId = (session.user as any).agencyId;
  if (!agencyId) {
    return <div className="p-8">Error: El usuario no tiene una agencia asociada.</div>;
  }

  const [agency, leadsCount, activeSession, recentLeads] = await Promise.all([
    prisma.agency.findUnique({ where: { id: agencyId } }),
    prisma.lead.count({ where: { agencyId } }),
    prisma.whatsappSession.findFirst({
      where: { agencyId, status: "CONNECTED" },
    }),
    prisma.lead.findMany({
      where: { agencyId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const qualifiedLeads = await prisma.lead.count({
    where: { agencyId, status: "QUALIFIED" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">¡Hola, {session.user.name}! 👋</h2>
          <p className="text-sm text-[#a3a3a3] mt-1">
            {agency?.name} · {agency?.industryType === "REAL_ESTATE" ? "🏠 Inmobiliaria" : "✈️ Viajes"}
          </p>
        </div>
        <div className={`badge ${activeSession ? "badge-success" : "badge-error"} text-sm px-4 py-1.5`}>
          {activeSession ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card hover:border-brand-500/50 transition-colors">
          <p className="text-sm font-medium text-[#a3a3a3]">Total Leads</p>
          <p className="text-3xl font-bold mt-2">{leadsCount}</p>
        </div>
        <div className="card hover:border-brand-500/50 transition-colors">
          <p className="text-sm font-medium text-[#a3a3a3]">Leads Calificados</p>
          <p className="text-3xl font-bold mt-2 text-brand-500">{qualifiedLeads}</p>
        </div>
        <div className="card hover:border-brand-500/50 transition-colors">
          <p className="text-sm font-medium text-[#a3a3a3]">Sesión de WhatsApp</p>
          <p className="text-lg font-bold mt-2">
            {activeSession ? "🟢 Activa" : "🔴 Inactiva"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Leads Recientes</h3>
        {recentLeads.length > 0 ? (
          <div className="bg-[#111111] border border-[#262626] rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1a1a1a] text-[#a3a3a3]">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium text-center">Mensajes</th>
                  <th className="px-4 py-3 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#1a1a1a]/50">
                    <td className="px-4 py-3 font-medium text-white">{lead.name || "Sin nombre"}</td>
                    <td className="px-4 py-3 text-[#a3a3a3]">{lead.phoneNumber}</td>
                    <td className="px-4 py-3 text-center text-[#a3a3a3]">{lead._count.messages}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`badge ${
                        lead.status === "QUALIFIED" ? "badge-success" : 
                        lead.status === "CONTACTED" ? "badge-warning" : "bg-blue-900 text-blue-100 border-transparent"
                      }`}>
                        {lead.status === "QUALIFIED" ? "Calificado" : lead.status === "CONTACTED" ? "Contactado" : "Nuevo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-white">Aún no tienes leads</h3>
            <p className="text-[#a3a3a3] mt-2">Conecta WhatsApp para empezar a recibir mensajes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
