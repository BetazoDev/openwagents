import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function CatalogPage() {
  const session = await auth();
  const agencyId = (session?.user as any)?.agencyId;

  const items = await prisma.catalogItem.findMany({
    where: { agencyId },
    orderBy: { createdAt: "desc" }
  });

  async function createItemAction(formData: FormData) {
    "use server";
    const userSession = await auth();
    const aid = (userSession?.user as any)?.agencyId;
    if (!aid) return;

    await prisma.catalogItem.create({
      data: {
        agencyId: aid,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        price: formData.get("price") ? parseFloat(formData.get("price") as string) : null,
        location: formData.get("location") as string,
        isActive: true,
      }
    });
    revalidatePath("/dashboard/catalog");
  }

  async function deleteItemAction(formData: FormData) {
    "use server";
    const userSession = await auth();
    const aid = (userSession?.user as any)?.agencyId;
    if (!aid) return;

    const itemId = formData.get("itemId") as string;
    await prisma.catalogItem.deleteMany({
      where: { id: itemId, agencyId: aid }
    });
    revalidatePath("/dashboard/catalog");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Catálogo</h1>
        <p className="text-[#a3a3a3]">
          Agrega propiedades o paquetes de viajes. La IA podrá buscar en este catálogo automáticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-6">Agregar Nuevo</h2>
            <form action={createItemAction} className="space-y-4">
              <div>
                <label className="label">Título</label>
                <input type="text" name="title" required className="input" placeholder="Ej: Depto en Polanco" />
              </div>
              <div>
                <label className="label">Descripción Corta</label>
                <textarea name="description" required rows={3} className="input resize-none" placeholder="2 recámaras, 2 baños..."></textarea>
              </div>
              <div>
                <label className="label">Ubicación</label>
                <input type="text" name="location" className="input" placeholder="CDMX" />
              </div>
              <div>
                <label className="label">Precio (Opcional)</label>
                <input type="number" name="price" className="input" placeholder="45000" />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2">Guardar Ítem</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Inventario ({items.length})</h2>
          
          {items.length === 0 ? (
            <div className="card text-center py-12 border-dashed border-[#333]">
              <p className="text-[#a3a3a3]">Tu catálogo está vacío.</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="card p-5 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-brand-400 font-mono my-1">
                    {item.price ? `$${Number(item.price).toLocaleString()}` : "Precio a consultar"} 
                    {item.location && ` • ${item.location}`}
                  </p>
                  <p className="text-sm text-[#a3a3a3] line-clamp-2">{item.description}</p>
                </div>
                <div className="flex items-center">
                  <form action={deleteItemAction}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button type="submit" className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-2 bg-red-900/20 rounded-md transition-colors">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
