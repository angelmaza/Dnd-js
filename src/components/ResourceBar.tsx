// src/components/ResourceBar.tsx
"use client";

import { useEffect, useState, useCallback } from "react";

type MonedaUI = { Nombre: string; Cantidad: number };
type DineroApi = { id_moneda: number; nombre: string | null; cantidad: number | null };

const colorByNombre: Record<string, string> = {
  Cobre: "var(--cobre)",
  Plata: "var(--plata)",
  Oro: "var(--oro)",
  Electro: "var(--electro)",
};
const ORDER = ["Cobre", "Plata", "Oro", "Electro"];

export default function ResourceBar() {
  const [data, setData] = useState<MonedaUI[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDinero = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dinero", { cache: "no-store" });
      if (!res.ok) 
          throw new Error("Error al cargar /api/dinero");
      const json = (await res.json()) as DineroApi[];
      const mapped: MonedaUI[] = json.map(m => ({
        Nombre: m.nombre ?? "Moneda",
        Cantidad: Number(m.cantidad ?? 0),
      }));
      mapped.sort((a, b) => {
        const ia = ORDER.indexOf(a.Nombre);
        const ib = ORDER.indexOf(b.Nombre);
        if (ia !== -1 || ib !== -1) return ia === -1 ? 1 : ib === -1 ? -1 : ia - ib;
        return a.Nombre.localeCompare(b.Nombre);
      });
      setData(mapped);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDinero();
  }, [loadDinero]);

  useEffect(() => {
    const handler = () => loadDinero();
    window.addEventListener("dinero:updated", handler as EventListener);
    return () => window.removeEventListener("dinero:updated", handler as EventListener);
  }, [loadDinero]);

  if (loading) {
    return (
      <div className="resourcebar">
        <div className="resource-item"><span className="resource-name">Cargando monedas…</span></div>
      </div>
    );
  }

  return (
    <div className="resourcebar">
      {data.map((m) => (
        <div key={m.Nombre} className="resource-item">
          <span className="resource-dot" style={{ backgroundColor: colorByNombre[m.Nombre] || "#777" }} />
          <span className="resource-name">{m.Nombre}:</span>
          <span className="resource-qty">{m.Cantidad}</span>
        </div>
      ))}
    </div>
  );
}
