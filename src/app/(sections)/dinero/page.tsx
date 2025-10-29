// src/app/(sections)/dinero/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Moneda = {
  id_moneda: number;
  nombre: string | null;
  cantidad: number | null;
};

export default function DineroPage() {
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setCargando(true);
      const res = await fetch("/api/dinero", { cache: "no-store" });
      if (res.ok) setMonedas(await res.json());
      setCargando(false);
    })();
  }, []);

  const total = useMemo(
    () => monedas.reduce((acc, m) => acc + (Number(m.cantidad ?? 0)), 0),
    [monedas]
  );

  function actualizarCantidad(id: number, cantidad: number) {
    setMonedas(prev =>
      prev.map(m => (m.id_moneda === id ? { ...m, cantidad: Math.max(0, cantidad) } : m))
    );
  }

  function incrementar(id: number) {
    const m = monedas.find(x => x.id_moneda === id);
    const nueva = (m?.cantidad ?? 0) + 1;
    actualizarCantidad(id, nueva);
  }

  function decrementar(id: number) {
    const m = monedas.find(x => x.id_moneda === id);
    const nueva = Math.max(0, (m?.cantidad ?? 0) - 1);
    actualizarCantidad(id, nueva);
  }

  async function guardarCambios() {
    setGuardando(true);
    setMensaje(null);
    const payload = monedas.map(m => ({
      id_moneda: m.id_moneda,
      cantidad: Number(m.cantidad ?? 0)
    }));
    const res = await fetch("/api/dinero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setGuardando(false);
    setMensaje(res.ok ? "Cambios guardados." : "Error al guardar.");
    if (res.ok) {
      // refresco ligero por si hay triggers/cambios externos
      const r = await fetch("/api/dinero", { cache: "no-store" });
      if (r.ok) setMonedas(await r.json());
      window.dispatchEvent(new CustomEvent("dinero:updated"));

    }
    setTimeout(() => setMensaje(null), 2200);
  }

  return (
    <section className="detail-wrap">
      <div className="panel">
        <div className="panel-head" style={{ justifyContent: "space-between" }}>
          <h2>Dinero</h2>
          <div className="resourcebar" style={{ gap: ".6rem" }}>
            <div className="resource-item">
              <span className="resource-dot" style={{ background: "var(--oro)" }} />
              <span className="resource-name">Total</span>
              <span className="resource-qty">{total}</span>
            </div>
            <button className="btn-accent" disabled={guardando || cargando} onClick={guardarCambios}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          {cargando ? (
            <div className="empty"><p>Cargando monedas…</p></div>
          ) : (
            <table className="table-medieval">
              <thead>
                <tr>
                  <th>Moneda</th>
                  <th style={{ width: 220 }}>Cantidad</th>
                  <th style={{ width: 160 }}></th>
                </tr>
              </thead>
              <tbody>
                {monedas.map(m => (
                  <tr key={m.id_moneda}>
                    <td>
                      <strong>{m.nombre ?? `Moneda #${m.id_moneda}`}</strong>
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={Number(m.cantidad ?? 0)}
                        onChange={e => actualizarCantidad(m.id_moneda, Number(e.target.value || 0))}
                        className="input-inline"
                        aria-label={`Cantidad de ${m.nombre ?? m.id_moneda}`}
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: ".4rem", justifyContent: "flex-end" }}>
                        <button className="btn-accent" onClick={() => incrementar(m.id_moneda)}>+</button>
                        <button className="btn-ghost" onClick={() => decrementar(m.id_moneda)}>-</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {mensaje && (
          <div className="empty" style={{ marginTop: 0 }}>
            <p>{mensaje}</p>
          </div>
        )}
      </div>

      {/* detalles mínimos de inputs para integrarse con tu estética */}
      <style jsx>{`
        .input-inline{
          width: 120px;
          background: #1c1721;
          border: 1px solid #2c2233;
          border-radius: 10px;
          padding: .45rem .6rem;
          color: var(--ink);
        }
      `}</style>
    </section>
  );
}
