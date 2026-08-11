"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Credenciales inválidas");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-[#262626] bg-[#111111] p-8 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Bienvenido a <span className="text-brand-500">InmobiliarIA</span>
          </h2>
          <p className="mt-2 text-sm text-[#a3a3a3]">
            Ingresa a tu panel de control de WhatsApp + IA
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
              <label className="label">Correo Electrónico</label>
              <input
                type="email"
                required
                className="input"
                placeholder="admin@luna.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center py-3 text-base"
            >
              {loading ? "Ingresando..." : "Ingresar al Dashboard"}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-[#737373]">
              ¿No tienes una cuenta? <Link href="/register" className="text-brand-500 hover:text-brand-400">Registrar mi Agencia</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
