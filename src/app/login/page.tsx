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

    router.push("/quests");
  }

  return (
    <div
      style={{
        minHeight: "50dvh",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
        backgroundBlendMode: "multiply",
      }}
    >
      <div className="panel" style={{ width: "min(440px, 94vw)", margin: 0 }}>
        <div className="panel-head">
          <h2 style={{ margin: 0 }}>Acceso</h2>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ paddingTop: ".9rem" }}>
          <div>
            <label className="muted" style={{ display: "block", marginBottom: ".25rem" }}>
              Nombre de usuario
            </label>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="muted" style={{ display: "block", marginBottom: ".25rem" }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div
              className="empty"
              style={{
                borderColor: "#5d0e1a",
                background: "rgba(138,15,38,.12)",
                color: "#fca5a5",
                textAlign: "left",
              }}
            >
              {error}
            </div>
          )}

          <div className="modal-actions right" style={{ paddingTop: 0 }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-accent"
              style={{ minWidth: 120, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
