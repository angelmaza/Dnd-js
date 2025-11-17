"use client";

import { useEffect, useMemo, useState } from "react";
import type { VAlchemyProporcionesRow } from "@/entidades/alchemy";
import { AlchemyGrid } from "@/components/AlchemyGrid";

/* ===== tipos locales ===== */
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




const MAX_ELEM = 5;
const BASES = ["Aceite", "Grasa"] as const;
type BaseNombre = (typeof BASES)[number];

export default function AlchemyPage() {
  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [idCrafter, setIdCrafter] = useState<number>(1);

  const [elementos, setElementos] = useState<Elemento[]>([]);
  const [recetasRaw, setRecetasRaw] = useState<VAlchemyProporcionesRow[]>([]);
  const [recetas, setRecetas] = useState<RecetaView[]>([]);

  const [mats, setMats] = useState<MaterialMap[]>([]);
  const [matSel, setMatSel] = useState<number | null>(null);
  //const [matCant, setMatCant] = useState<number>(1);

  const [nuevoMatNombre, setNuevoMatNombre] = useState("");
  const [nuevoMatElem1, setNuevoMatElem1] = useState("");
  const [nuevoMatElem2, setNuevoMatElem2] = useState("");

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
      recetasRaw.reduce((acc, r) => {
        const key = `${r.NombreProducto}__${r.Descripcion ?? ""}`;
        if (!acc[key])
          acc[key] = {
            NombreProducto: r.NombreProducto ?? "",
            Descripcion: r.Descripcion,
            Elementos: [] as VItem[],
          };
        if (r.NombreElemento)
          acc[key].Elementos.push({
            NombreElemento: r.NombreElemento,
            ProporcionElemento: r.ProporcionElemento ?? 0,
          });
        return acc;
      }, {} as Record<string, RecetaView>)
    ) as RecetaView[];

    const normalized = grouped.map((g) => ({
      ...g,
      Elementos: [
        ...g.Elementos,
        ...Array.from(
          { length: Math.max(0, MAX_ELEM - g.Elementos.length) },
          () => ({ NombreElemento: "", ProporcionElemento: 0 })
        ),
      ],
    }));

    setRecetas(normalized);
  }, [recetasRaw]);

  /* ===== colores ===== */
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

  const textColor = (backgroundColor: string) =>
    !["red", "black", "MediumVioletRed"].includes(backgroundColor) ? "#000000ff" : undefined;

  /* ===== helpers ===== */
  const recargarRecetas = async () => {
    const rr = await fetch("/api/alchemy/recetas", { cache: "no-store" });
    if (rr.ok) setRecetasRaw(await rr.json());
  };

  const agregarMaterialExtraible = async () => {
  const nombre = nuevoMatNombre.trim();
  if (!nombre) {
    alert("Pon un nombre de material");
    return;
  }

  const elementosSeleccionados = [nuevoMatElem1, nuevoMatElem2].filter(Boolean);
  if (!elementosSeleccionados.length) {
    alert("Selecciona al menos un elemento extraíble");
    return;
  }

  // Ajusta este payload a cómo esperes recibirlo en tu API de /api/alchemy/mats
  const payload = {
    material: nombre,
    elementos: elementosSeleccionados.map((nombre) => ({
      nombre,
      proporcion: 1, // puedes cambiar esto si luego quieres proporciones distintas
    })),
  };

  const res = await fetch("/api/alchemy/mats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const rm = await fetch("/api/alchemy/mats", { cache: "no-store" });
    if (rm.ok) {
      const data = (await rm.json()) as MaterialMap[];
      setMats(data);
      if (!matSel && data.length) setMatSel(data[0].id_material);
    }

    setNuevoMatNombre("");
    setNuevoMatElem1("");
    setNuevoMatElem2("");
  } else {
    const e = await res.json().catch(() => ({}));
    alert(e?.error ?? "Error al guardar el material");
  }
};


  /* ===== acciones: inventario ===== */
  const SumarElemento = async (e: Elemento) => {
    const nuevo = { ...e, cantidad: (e.cantidad ?? 0) + 1 };
    setElementos((prev) => prev.map((x) => (x.id_elemento === e.id_elemento ? nuevo : x)));
    await fetch("/api/alchemy/elementos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo),
    });
  };

  const RestarElemento = async (e: Elemento) => {
    if ((e.cantidad ?? 0) <= 0) return;
    const nuevaCantidad = { ...e, cantidad: (e.cantidad ?? 0) - 1 };
    setElementos((prev) => prev.map((x) => (x.id_elemento === e.id_elemento ? nuevaCantidad : x)));
    await fetch("/api/alchemy/elementos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaCantidad),
    });
  };

  /* ===== acciones: recetas ===== */
  const guardarReceta = async (receta: RecetaView) => {
    const copia: RecetaView = {
      ...receta,
      Elementos: receta.Elementos.map((e) => ({ ...e })),
    };

    const base = copia.Elementos[MAX_ELEM - 1];
    if (base && BASES.includes(base.NombreElemento as BaseNombre)) {
      base.ProporcionElemento = 1;
    }

    const res = await fetch("/api/alchemy/guardar-receta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(copia),
    });

    if (res.ok) {
      await recargarRecetas();
    } else {
      const e = await res.json().catch(() => ({}));
      alert(e?.error ?? "Error al guardar la receta");
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

  const eliminarRecetaFila = async (rec: RecetaView) => {
    const nombre = rec.NombreProducto.trim();
    if (!nombre) return;
    if (!confirm(`¿Eliminar la receta "${nombre}"?`)) return;

    const res = await fetch("/api/alchemy/guardar-receta", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });

    if (res.ok) {
      await recargarRecetas();
    } else {
      const e = await res.json().catch(() => ({}));
      alert(e?.error ?? "Error eliminando la receta");
    }
  };


// /* ===== acciones: extraer materiales ===== */
// const extraer = async () => {
//   if (!matSel || matCant <= 0) return;

//   const res = await fetch("/api/alchemy/extraer", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ id_material: matSel, cantidad: matCant }),
//   });

//   if (res.ok) {
//     refrescamos inventario de elementos y materiales
//     const re = await fetch("/api/alchemy/elementos", { cache: "no-store" });
//     if (re.ok) setElementos(await re.json());

//     const rm = await fetch("/api/alchemy/mats", { cache: "no-store" });
//     if (rm.ok) setMats(await rm.json());
//   } else {
//     const e = await res.json().catch(() => ({}));
//     alert(e?.error ?? "Error al extraer materiales");
//   }
// };


  /* ===== Render ===== */
  return (
    <section className="detail-wrap" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      {/* CABECERA + GRID RECETAS */}
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

        <AlchemyGrid
          recetas={recetas}
          colores={colores}
          onCraft={craft}
          onDelete={eliminarRecetaFila}
          elementosDisponibles={elementos.map((e) => e.nombre)}
          bases={BASES as unknown as string[]}
          onNuevaReceta={(r) => guardarReceta(r)}
        />
      </div>

      {/* ELEMENTOS */}
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

      {/* ===== MAPA DE EXTRACCIÓN DE MATERIALES ===== */}
<div className="panel">
  <div className="panel-head">
    <h2>Extraer Materiales</h2>
  </div>

  <div className="table-wrap" style={{ padding: "1rem" }}>
    {/* Lista de materiales existentes */}
    <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
      {mats.map((m) => (
        <div
          key={m.id_material}
          className="mission-card"
          style={{ margin: 0, cursor: "default" }}
        >
          <div className="mission-card-head">
            <div className="mission-card-titles">
              <div className="mission-card-title">
                {m.material ?? "Material sin nombre"}
              </div>
              <div className="mission-card-sub">
                Stock actual: {m.cant_material}
              </div>
            </div>

            <div className="mission-card-tags">
              <span className="muted">Elementos extraíbles:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".25rem" }}>
                {m.elementos.map((el, i) => {
                  const backgroundColor = colores.get(el.nombre) || "transparent";
                  const fg = textColor(backgroundColor || "");
                  return (
                    <span
                      key={i}
                      className="badge"
                      style={{ background: "transparent" }}
                    >
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
                      <span className="muted">x{el.proporcion}</span>
                    </span>
                  );
                })}
                {m.elementos.length === 0 && (
                  <span className="muted">— Sin mapeo de extracción —</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {mats.length === 0 && (
        <div className="empty">
          <p>No hay materiales configurados aún.</p>
        </div>
      )}
    </div>

    {/* Fila para añadir nuevo material */}
    <div
      style={{
        marginTop: "1rem",
        paddingTop: ".75rem",
        borderTop: "1px solid #2c2233",
      }}
    >
      <h3
        style={{
          margin: "0 0 .5rem",
          fontFamily: "Cinzel, serif",
          fontSize: "1rem",
        }}
      >
        Añadir nuevo material extraíble
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.5fr) minmax(0, 1.5fr) auto",
          gap: ".5rem",
          alignItems: "center",
        }}
      >
        <input
          className="btn"
          style={{ width: "100%" }}
          placeholder="Nombre del material"
          value={nuevoMatNombre}
          onChange={(e) => setNuevoMatNombre(e.target.value)}
        />

        <select
          className="btn"
          value={nuevoMatElem1}
          onChange={(e) => setNuevoMatElem1(e.target.value)}
        >
          <option value="">Elemento extraíble 1</option>
          {elementos.map((el) => (
            <option key={el.id_elemento} value={el.nombre}>
              {el.nombre}
            </option>
          ))}
        </select>

        <select
          className="btn"
          value={nuevoMatElem2}
          onChange={(e) => setNuevoMatElem2(e.target.value)}
        >
          <option value="">Elemento extraíble 2</option>
          {elementos.map((el) => (
            <option key={el.id_elemento} value={el.nombre}>
              {el.nombre}
            </option>
          ))}
        </select>

        <button className="btn-accent" onClick={agregarMaterialExtraible}>
          Añadir
        </button>
      </div>
    </div>
  </div>
</div>

    </section>
  );
}
