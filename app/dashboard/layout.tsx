import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#262626] bg-[#111111] flex flex-col hidden md:flex">
        <div className="p-6 border-b border-[#262626]">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-accent">
            InmobiliarIA
          </h1>
          <p className="text-xs text-[#a3a3a3] mt-1">CRM + IA WhatsApp</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <span className="mr-3">📊</span> Dashboard
          </Link>
          <Link href="/dashboard/leads" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <span className="mr-3">👥</span> Leads (CRM)
          </Link>
          <Link href="/dashboard/catalog" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <span className="mr-3">📋</span> Catálogo
          </Link>
          <Link href="/dashboard/conversations" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <span className="mr-3">💬</span> Conversaciones
          </Link>
          
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-[#737373] uppercase tracking-wider">
              Automatización
            </p>
          </div>
          
          <Link href="/dashboard/agents" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <span className="mr-3">🤖</span> Agentes IA
          </Link>
          <Link href="/dashboard/whatsapp" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <span className="mr-3">📱</span> WhatsApp
          </Link>
        </nav>

        <div className="p-4 border-t border-[#262626]">
          <form action={async () => {
            "use server";
            await signOut();
          }}>
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-[#a3a3a3] rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors">
              <span className="mr-3">🚪</span> Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[#262626] bg-[#111111]">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-accent">
            InmobiliarIA
          </h1>
          <button className="p-2">
            <span className="text-xl">☰</span>
          </button>
        </header>

        {/* Topbar for desktop */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-[#262626] bg-[#0a0a0a]">
          <div className="text-sm text-[#a3a3a3]">
            {session.user.name} <span className="mx-2">•</span> {(session.user as any).role}
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
