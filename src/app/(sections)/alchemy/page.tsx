"use client";

import { useEffect, useMemo, useState } from "react";
import type { VAlchemyProporcionesRow } from "@/entidades/alchemy";

/* ===== tipos locales (ligeros) ===== */
type Personaje = { id_pj: number; nombre: string };
type Elemento = { id_elemento: number; nombre: string; cantidad: number | null; color?: string | null };
type VItem = { NombreElemento: string; ProporcionElemento: number };
type RecetaView = { NombreProducto: string; Descripcion: string | null; Elementos: VItem[] };
type MaterialMap = {
  id_material: number;
  material: string | null;
  cant_material: number;
  elementos: { nombre: string; proporcion: number }[];
};
type BaseNombre = typeof BASES[number]; // "Aceite" | "Grasa"

const MAX_ELEM = 5;
const BASES = ["Aceite", "Grasa"] as const;

export default function AlchemyPage() {
  /* ===== estado ===== */
  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [idCrafter, setIdCrafter] = useState<number>(1);

  const [elementos, setElementos] = useState<Elemento[]>([]);
  const [recetasRaw, setRecetasRaw] = useState<VAlchemyProporcionesRow[]>([]);
  const [recetas, setRecetas] = useState<RecetaView[]>([]);

  const [mats, setMats] = useState<MaterialMap[]>([]);
  const [matSel, setMatSel] = useState<number | null>(null);
  const [matCant, setMatCant] = useState<number>(1);

  const [nueva, setNueva] = useState<RecetaView>({
    NombreProducto: "",
    Descripcion: "",
    Elementos: Array.from({ length: MAX_ELEM }, () => ({ NombreElemento: "", ProporcionElemento: 0 })),
  });

  /* ===== carga inicial ===== */
  useEffect(() => {
    (async () => {
      const rp = await fetch("/api/personajes", { cache: "no-store" });
      if (rp.ok) {
        const ps = (await rp.json()) as Personaje[];
        setPersonajes(ps);
        if (ps.length) setIdCrafter(ps[0].id_pj);
      }

      const rr = await fetch("/api/alchemy/recetas", { cache: "no-store" });
      if (rr.ok) setRecetasRaw(await rr.json());

      const re = await fetch("/api/alchemy/elementos", { cache: "no-store" });
      if (re.ok) setElementos(await re.json());

      const rm = await fetch("/api/alchemy/mats", { cache: "no-store" });
      if (rm.ok) {
        const data = (await rm.json()) as MaterialMap[];
        setMats(data);
        if (data.length) setMatSel(data[0].id_material);
      }
    })();
  }, []);

  /* ===== agrupar recetas ===== */
  useEffect(() => {
    const grouped = Object.values(
      recetasRaw .reduce((acc, r) => {
        const key = `${r.NombreProducto}__${r.Descripcion ?? ""}`;
        if (!acc[key]) acc[key] = { NombreProducto: r.NombreProducto ?? "", Descripcion: r.Descripcion, Elementos: [] as VItem[] };
        if (r.NombreElemento) acc[key].Elementos.push({ NombreElemento: r.NombreElemento, ProporcionElemento: r.ProporcionElemento ?? 0 });
        return acc;
      }, {} as Record<string, RecetaView>)
    ) as RecetaView[];

    const normalized = grouped.map(g => ({
      ...g,
      Elementos: [
        ...g.Elementos,
        ...Array.from({ length: Math.max(0, MAX_ELEM - g.Elementos.length) }, () => ({
          NombreElemento: "",
          ProporcionElemento: 0,
        })),
      ],
    }));
    setRecetas(normalized);
  }, [recetasRaw]);

  /* ===== colores de elementos (coinciden con tu diseño) ===== */
  const colores = useMemo(
    () =>
      new Map<string, string>([
        ["Cinabrio", "orange"],
        ["Azogue", "LightGray"],
        ["Eter", "MediumVioletRed"],
        ["Azufre", "yellow"],
        ["Vitriolo", "aqua"],
        ["Rebis", "LightGreen"],
        ["Nigredo", "black"],
        ["Albedo", "white"],
        ["Rubedo", "red"],
        ["Aceite", "gray"],
        ["Grasa", ""],
      ]),
    []
  );
  //             =  al background color --> si  incluye uno que no sea estos, ponne color negro.
  const textColor = (backgroundColor: string) => (!["red", "black", "MediumVioletRed"].includes(backgroundColor) ? "#000000ff" : undefined);

  /* ===== acciones: inventario elementos ===== */
  const SumarElemento = async (e: Elemento) => {
    const nuevo = { ...e, cantidad: (e.cantidad ?? 0) + 1 };
    setElementos(prev => prev.map(x => (x.id_elemento === e.id_elemento ? nuevo : x)));
    await fetch("/api/alchemy/elementos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo),
    });
  };

  const RestarElemento = async (e: Elemento) => {
    if ((e.cantidad ?? 0) <= 0) return; //si es null o 0. Sale, no se puede restar.
    const nuevaCantidad = { ...e, cantidad: (e.cantidad ?? 0) - 1 }; // Resta 1m usa una copia de e
    setElementos(prev => prev.map(x => (x.id_elemento === e.id_elemento ? nuevaCantidad : x)));
    await fetch("/api/alchemy/elementos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaCantidad),
    });
  };

  /* ===== acciones: recetas ===== */
  const guardarReceta = async () => {
    const base = nueva.Elementos[MAX_ELEM - 1];
    if (BASES.includes(base.NombreElemento as BaseNombre)) base.ProporcionElemento = 1;

    const res = await fetch("/api/alchemy/guardar-receta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nueva),
    });
    if (res.ok) {
      const rr = await fetch("/api/alchemy/recetas", { cache: "no-store" });
      if (rr.ok) setRecetasRaw(await rr.json());
      setNueva({
        NombreProducto: "",
        Descripcion: "",
        Elementos: Array.from({ length: MAX_ELEM }, () => ({ NombreElemento: "", ProporcionElemento: 0 })),
      });
    }
  };

  const craft = async (rec: RecetaView) => {
    const payload = { Receta: rec, IdCrafter: idCrafter };
    const res = await fetch("/api/alchemy/craft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const re = await fetch("/api/alchemy/elementos", { cache: "no-store" });
      if (re.ok) setElementos(await re.json());
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Error al craftear");
    }
  };

  /* ===== acciones: extraer materiales ===== */
  const extraer = async () => {
    if (!matSel || matCant <= 0) return;
    const res = await fetch("/api/alchemy/extraer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_material: matSel, cantidad: matCant }),
    });

    if (res.ok) {
      const re = await fetch("/api/alchemy/elementos", { cache: "no-store" });
      if (re.ok) setElementos(await re.json());
      const rm = await fetch("/api/alchemy/mats", { cache: "no-store" });
      if (rm.ok) setMats(await rm.json());
    } else {
      const e = await res.json().catch(() => ({}));
      alert(e?.error ?? "Error al extraer materiales");
    }
  };

  /* ===== Render ===== */
  return (
    // ocupar todo el ancho del área de contenido y evitar overflow lateral
    <section className="detail-wrap" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      {/* ===== CABECERA + SELECT CRAFTER ===== */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: "wrap", gap: ".6rem 1rem" }}>
          <h2 style={{ marginRight: "auto" }}>Alchemy</h2>
          <div className="resourcebar" style={{ gap: ".6rem", alignItems: "center" }}>
            <span className="resource-name">Personaje crafteando:</span>
            <select
              className="btn"
              value={idCrafter}
              onChange={(e) => setIdCrafter(Number(e.target.value))}
            >
              {personajes.map((p) => (
                <option key={p.id_pj} value={p.id_pj}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ===== TABLA RECETAS ===== */}
        <div className="table-wrap" style={{ overflowX: "auto" }}>
          <table className="table-medieval" style={{ tableLayout: "auto", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ minWidth: 180 }}>Producto</th>
                <th style={{ minWidth: 220 }}>Descripción</th>
                {Array.from({ length: MAX_ELEM - 1 }).map((_, i) => (
                  <th key={i} style={{ minWidth: 160 }}>Elemento {i + 1}</th>
                ))}
                <th style={{ minWidth: 120 }}>Base</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>

            <tbody>
              {recetas.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.NombreProducto}</td>
                  <td className="muted">{r.Descripcion ?? "—"}</td>
                  {Array.from({ length: MAX_ELEM }).map((_, i) => {
                    const el = r.Elementos[i];
                    const backgroundColor = colores.get(el?.NombreElemento || "") || "transparent";
                    const fg = textColor(backgroundColor || "");
                    return (
                      <td key={i} style={{ backgroundColor: backgroundColor, color: fg, whiteSpace: "nowrap" }}>
                        {el?.NombreElemento ? `${el.NombreElemento} -> ${el.ProporcionElemento}` : ""}
                      </td>
                    );
                  })}
                  <td>
                    <button className="btn-accent" onClick={() => craft(r)}>
                      Craft
                    </button>
                  </td>
                </tr>
              ))}

              {/* ----- NUEVA RECETA ----- */}
              <tr>
                <td>
                  <input
                    value={nueva.NombreProducto}
                    onChange={(e) => setNueva({ ...nueva, NombreProducto: e.target.value })}
                    placeholder="Nombre Nueva Receta"
                    style={{ width: "100%" }}
                  />
                </td>
                <td>
                  <input
                    value={nueva.Descripcion ?? ""}
                    onChange={(e) => setNueva({ ...nueva, Descripcion: e.target.value })}
                    placeholder="Descripción"
                    style={{ width: "100%" }}
                  />
                </td>

                {Array.from({ length: MAX_ELEM }).map((_, i) => {
                  const isBase = i === MAX_ELEM - 1;
                  const el = nueva.Elementos[i];
                  return (
                    <td key={i}>
                      {isBase ? (
                        <select
                          value={el.NombreElemento}
                          onChange={(e) => {
                            const copy = [...nueva.Elementos];
                            copy[i] = { ...copy[i], NombreElemento: e.target.value };
                            setNueva({ ...nueva, Elementos: copy });
                          }}
                          style={{ width: "100%" }}
                        >
                          <option value="">Seleccione Base</option>
                          {BASES.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: ".4rem" }}>
                          <select
                            value={el.NombreElemento}
                            onChange={(e) => {
                              const copy = [...nueva.Elementos];
                              copy[i] = { ...copy[i], NombreElemento: e.target.value };
                              setNueva({ ...nueva, Elementos: copy });
                            }}
                          >
                            <option value="">Seleccione</option>
                            {elementos.map((x) => (
                              <option key={x.id_elemento} value={x.nombre}>
                                {x.nombre}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={el.ProporcionElemento}
                            onChange={(e) => {
                              const copy = [...nueva.Elementos];
                              copy[i] = { ...copy[i], ProporcionElemento: Number(e.target.value || 0) };
                              setNueva({ ...nueva, Elementos: copy });
                            }}
                          />
                        </div>
                      )}
                    </td>
                  );
                })}

                <td>
                  <button className="btn btn-accent" onClick={guardarReceta}>
                    Agregar Receta
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== INVENTARIO DE ELEMENTOS ===== */}
      <div className="panel">
        <div className="panel-head">
          <h2>Elementos</h2>
        </div>
        <div className="table-wrap" style={{ padding: "1rem" }}>
          <div className="resourcebar" style={{ flexWrap: "wrap", gap: ".6rem 1rem" }}>
            {elementos.map((el) => {
              const backgroundColor = colores.get(el.nombre) || "transparent";
              const fg = textColor(backgroundColor || "");
              return (
                <div key={el.id_elemento} className="badge" style={{ backgroundColor: "transparent" }}>
                  <span
                    style={{
                      background: backgroundColor,
                      color: fg,
                      padding: ".1rem .35rem",
                      borderRadius: 6,
                      border: "1px solid #3a2d43",
                    }}
                  >
                    {el.nombre}
                  </span>
                  <strong>{el.cantidad ?? 0}</strong>
                  <button className="btn-ghost" onClick={() => SumarElemento(el)}>
                    +
                  </button>
                  <button className="btn-ghost" onClick={() => RestarElemento(el)}>
                    -
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== EXTRAER MATERIALES ===== */}
      <div className="panel">
        <div className="panel-head">
          <h2>Extraer Materiales</h2>
        </div>
        <div className="table-wrap" style={{ padding: "1rem" }}>
          <div className="resourcebar" style={{ gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <label className="muted" style={{ display: "block", marginBottom: ".25rem" }}>
                Material
              </label>
              <select
                className="btn"
                value={matSel ?? ""}
                onChange={(e) => setMatSel(Number(e.target.value))}
              >
                {mats.map((m) => (
                  <option key={m.id_material} value={m.id_material}>
                    {m.material} (stock: {m.cant_material})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="muted" style={{ display: "block", marginBottom: ".25rem" }}>
                Cantidad
              </label>
              <input
                type="number"
                className="btn"
                min={1}
                value={matCant}
                onChange={(e) => setMatCant(Math.max(1, Number(e.target.value || 1)))}
                style={{ width: 120 }}
              />
            </div>

            {/* vista previa */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem 1rem", flex: 1 }}>
              {(mats.find((m) => m.id_material === matSel)?.elementos ?? []).map((el, i) => {
                const backgroundColor = colores.get(el.nombre) || "transparent";
                const fg = textColor(backgroundColor || "");
                const total = el.proporcion * (matCant || 0);
                return (
                  <div key={i} className="badge" style={{ background: "transparent" }}>
                    <span
                      style={{
                        background: backgroundColor,
                        color: fg,
                        padding: ".1rem .35rem",
                        borderRadius: 6,
                        border: "1px solid #3a2d43",
                      }}
                    >
                      {el.nombre}
                    </span>
                    <strong>+{total}</strong>
                    <span className="muted">({el.proporcion} / 1)</span>
                  </div>
                );
              })}
            </div>

            <div>
              <button className="btn-accent" onClick={extraer}>
                Extraer
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
