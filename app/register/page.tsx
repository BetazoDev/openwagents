"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    agencyName: "",
    adminName: "",
    email: "",
    password: "",
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar la agencia");
      }

      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-[#262626] bg-[#111111] p-8 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Nueva <span className="text-brand-500">Agencia</span>
          </h2>
          <p className="mt-2 text-sm text-[#a3a3a3]">
            Crea tu espacio de trabajo (Multi-tenant)
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-900/50 p-4 border border-red-500/50">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Nombre de la Agencia</label>
              <input
                type="text"
                required
                className="input"
                placeholder="Ej. Inmobiliaria Luna"
                value={form.agencyName}
                onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
              />
            </div>
            
            <div className="pt-4 border-t border-[#262626]">
              <p className="text-xs font-semibold text-[#737373] uppercase mb-4">
                Datos del Administrador
              </p>
            </div>
            
            <div>
              <label className="label">Tu Nombre</label>
              <input
                type="text"
                required
                className="input"
                placeholder="Juan Pérez"
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
              />
            </div>
            
            <div>
              <label className="label">Correo Electrónico</label>
              <input
                type="email"
                required
                className="input"
                placeholder="admin@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center py-3 text-base"
            >
              {loading ? "Registrando..." : "Crear Cuenta de Agencia"}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-[#737373]">
              ¿Ya tienes cuenta? <Link href="/login" className="text-brand-500 hover:text-brand-400">Iniciar Sesión</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
