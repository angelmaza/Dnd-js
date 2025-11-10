// src/app/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al iniciar sesión");
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black/80">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-xs flex flex-col gap-4"
      >
        <h1 className="text-xl font-semibold text-white text-center">
          DnD_js · Acceso
        </h1>

        <input
          type="text"
          placeholder="Nombre"
          className="w-full rounded-md px-3 py-2 bg-zinc-800 text-white border border-zinc-600 focus:outline-none focus:ring focus:ring-red-500/60"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full rounded-md px-3 py-2 bg-zinc-800 text-white border border-zinc-600 focus:outline-none focus:ring focus:ring-red-500/60"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md px-3 py-2 bg-red-600 text-white font-medium hover:bg-red-500 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
