import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function WhatsAppPage() {
  const session = await auth();
  const agencyId = (session?.user as any)?.agencyId;

  const currentSession = await prisma.whatsappSession.findFirst({
    where: { agencyId },
  });

  async function connectAction(formData: FormData) {
    "use server";
    const userSession = await auth();
    const aid = (userSession?.user as any)?.agencyId;
    if (!aid) return;

    const name = formData.get("name") as string;
    
    // Aquí invocaríamos a OpenWA / WAHA API real.
    // Por ahora, solo guardamos el registro para activar el "Connected".
    const existing = await prisma.whatsappSession.findFirst({
      where: { agencyId: aid }
    });

    if (existing) {
      await prisma.whatsappSession.update({
        where: { id: existing.id },
        data: { status: "CONNECTED", sessionName: name }
      });
    } else {
      await prisma.whatsappSession.create({
        data: {
          agencyId: aid,
          sessionName: name,
          status: "CONNECTED",
        }
      });
    }
    revalidatePath("/dashboard/whatsapp");
  }

  async function disconnectAction() {
    "use server";
    const userSession = await auth();
    const aid = (userSession?.user as any)?.agencyId;
    if (!aid) return;

    await prisma.whatsappSession.deleteMany({
      where: { agencyId: aid }
    });
    revalidatePath("/dashboard/whatsapp");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Conexión de WhatsApp</h1>
      <p className="text-[#a3a3a3] mb-8">
        Vincula tu número de WhatsApp para que la Inteligencia Artificial comience a responder y calificar a tus leads automáticamente.
      </p>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Estado Actual</h2>
        
        {currentSession && currentSession.status === "CONNECTED" ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/50 p-4 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <div>
                <p className="font-medium text-green-400">Conectado y Operativo</p>
                <p className="text-sm text-green-200/70">Sesión: {currentSession.sessionName}</p>
              </div>
            </div>

            <form action={disconnectAction}>
              <button type="submit" className="btn bg-red-600 hover:bg-red-700 text-white w-full">
                Desconectar WhatsApp
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 bg-red-900/20 border border-red-500/50 p-4 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <p className="font-medium text-red-400">Desconectado</p>
            </div>

            <form action={connectAction} className="space-y-4">
              <div>
                <label className="label">Nombre de la Sesión (ej: Ventas Principal)</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="input" 
                  placeholder="Ventas Principal"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Conectar / Generar QR
              </button>
              <p className="text-xs text-center text-[#737373] mt-2">
                Al hacer clic, el sistema se comunicará con tu instancia de OpenWA.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
