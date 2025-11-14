// src/app/(sections)/npcs/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Npc = {
  id_npc: number;
  nombre: string | null;
  informacion: string | null;
  clasificacion: string | null;
  imagen: string | null;
  imagen_fondo: string | null;
  rango: number | null;
};

const DEFAULT_BG = "/images/Bosque.jpg"; // fondo por defecto

export default function NpcsPage() {
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // modal crear/editar
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Npc | null>(null);

  // form state
  const [formNombre, setFormNombre] = useState("");
  const [formInformacion, setFormInformacion] = useState("");
  const [formClasificacion, setFormClasificacion] = useState("");
  const [formImagen, setFormImagen] = useState("");
  const [formRango, setFormRango] = useState<number | "">("");

  // modal ver detalle
  const [viewing, setViewing] = useState<Npc | null>(null);

  useEffect(() => {
    cargarNpcs();
  }, []);

  async function cargarNpcs() {
    setIsLoading(true);
    const r = await fetch("/api/npcs", { cache: "no-store" });
    if (r.ok) setNpcs(await r.json());
    setIsLoading(false);
  }

  function abrirCrear() {
    setEditing(null);
    setFormNombre("");
    setFormInformacion("");
    setFormClasificacion("");
    setFormImagen("");
    setFormRango("");
    setIsFormOpen(true);
  }

  function abrirEditar(npc: Npc) {
    setEditing(npc);
    setFormNombre(npc.nombre ?? "");
    setFormInformacion(npc.informacion ?? "");
    setFormClasificacion(npc.clasificacion ?? "");
    setFormImagen(npc.imagen ?? "");
    setFormRango(npc.rango ?? "");
    setIsFormOpen(true);
  }

  function cerrarForm() {
    setIsFormOpen(false);
  }

  async function guardarNpc() {
    const nombre = formNombre.trim();
    if (!nombre) return;

    const rango =
      formRango === "" ? null : Math.max(0, Number.isFinite(formRango as number) ? Number(formRango) : 0);

    if (editing) {
      // EDITAR: NO tocamos imagen_fondo aquí (queda como está en BD)
      const payload = {
        id_npc: editing.id_npc,
        nombre,
        informacion: formInformacion.trim() || null,
        clasificacion: formClasificacion.trim() || null,
        imagen: formImagen.trim() || null,
        rango,
      };
      await fetch("/api/npcs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      // CREAR: fijamos imagen_fondo automáticamente a Bosque.jpg
      const payload = {
        nombre,
        informacion: formInformacion.trim() || null,
        clasificacion: formClasificacion.trim() || null,
        imagen: formImagen.trim() || null,
        imagen_fondo: "Bosque.jpg",
        rango,
      };
      await fetch("/api/npcs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setIsFormOpen(false);
    await cargarNpcs();
  }

  async function eliminarNpc(id: number) {
    if (!confirm("¿Eliminar este NPC?")) return;
    await fetch("/api/npcs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_npc: id }),
    });
    await cargarNpcs();
  }

  // Layout tarjetas
  const gridCols = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "1rem",
    }),
    []
  );

  // Agrupación por rango
  const ranks = useMemo(() => {
    const set = new Set<number>();
    for (const n of npcs) {
      const r = n.rango ?? 0;
      if (r > 0) set.add(r);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [npcs]);

  const sinRango = useMemo(
    () =>
      npcs
        .filter((n) => (n.rango ?? 0) === 0)
        .sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "")),
    [npcs]
  );

  const renderCard = (n: Npc) => (
    <div
      key={n.id_npc}
      className="panel"
      style={{ margin: 0 }}
      onClick={() => setViewing(n)}
    >
      <div className="panel-head" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid #3a2d43",
              background: "#1c1721",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
            }}
          >
            {n.imagen ? (
              <img
                alt={n.nombre ?? ""}
                src={n.imagen.startsWith("/") ? n.imagen : `/tokens/${n.imagen}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              "🧛"
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{n.nombre ?? "Sin nombre"}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {n.clasificacion ?? ""}
            </div>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 12 }}>Rango: {n.rango ?? "—"}</div>
      </div>

      <div style={{ padding: "0.8rem 1rem 1rem" }}>
        <p className="muted" style={{ margin: 0 }}>
          {n.informacion
            ? n.informacion.length > 120
              ? n.informacion.slice(0, 120) + "…"
              : n.informacion
            : ""}
        </p>
      </div>
    </div>
  );

  const renderGrupoRango = (r: number) => {
    const grupo = npcs
      .filter((n) => (n.rango ?? 0) === r)
      .sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? ""));
    if (grupo.length === 0) return null;

    return (
      <div className="panel" key={`rango-${r}`}>
        <div className="panel-head">
          <h2>Rango {r}</h2>
          <span className="muted">{grupo.length} NPC{grupo.length !== 1 && "s"}</span>
        </div>
        <div className="table-wrap" style={{ padding: "1rem" }}>
          <div style={gridCols}>{grupo.map(renderCard)}</div>
        </div>
      </div>
    );
  };

  return (
    <section className="detail-wrap">
      <div className="panel">
        <div className="panel-head">
          <h2>NPCs</h2>
          <button className="btn-accent" onClick={abrirCrear}>Nuevo NPC</button>
        </div>
      </div>

      {!isLoading && ranks.map((r) => renderGrupoRango(r))}

      {!isLoading && sinRango.length > 0 && (
        <div className="panel" key="rango-none">
          <div className="panel-head">
            <h2>Sin rango</h2>
            <span className="muted">{sinRango.length} NPC{sinRango.length !== 1 && "s"}</span>
          </div>
          <div className="table-wrap" style={{ padding: "1rem" }}>
            <div style={gridCols}>{sinRango.map(renderCard)}</div>
          </div>
        </div>
      )}

      {/* MODAL: Ver detalle */}
      {viewing && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{
              backgroundImage: `url(${
                viewing.imagen_fondo
                  ? (viewing.imagen_fondo.startsWith("/") ? viewing.imagen_fondo : `/images/${viewing.imagen_fondo}`)
                  : DEFAULT_BG
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="modal-head" style={{ background: "rgba(0,0,0,.35)" }}>
              <h3>{viewing.nombre}</h3>
              <button className="btn-ghost" onClick={() => setViewing(null)}>✖</button>
            </div>
            <div className="modal-body" style={{ background: "rgba(18,14,22,.65)", borderTop: "1px solid #2c2233" }}>
              <div style={{ display: "grid", placeItems: "center", marginBottom: ".8rem" }}>
                <div
                  style={{
                    width: 160, height: 160, borderRadius: "50%",
                    overflow: "hidden", border: "1px solid #3a2d43", background: "#1c1721",
                  }}
                >
                  {viewing.imagen ? (
                    <img
                      alt={viewing.nombre ?? ""}
                      src={viewing.imagen.startsWith("/") ? viewing.imagen : `/tokens/${viewing.imagen}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 56 }}>🧛</div>
                  )}
                </div>
              </div>
              <p><b>Rango:</b> {viewing.rango ?? "—"}</p>
              <p><b>Clasificación:</b> {viewing.clasificacion ?? "—"}</p>
              <p style={{ whiteSpace: "pre-wrap" }}>
                <b>Información:</b><br />{viewing.informacion ?? "—"}
              </p>
              <div style={{ display: "flex", gap: ".4rem", justifyContent: "flex-end" }}>
                <button className="btn-ghost" onClick={() => abrirEditar(viewing)}>Editar</button>
                <button className="btn-ghost" onClick={() => eliminarNpc(viewing.id_npc)}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear / Editar (sin campo de imagen de fondo) */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head">
              <h3>{editing ? "Editar NPC" : "Nuevo NPC"}</h3>
              <button className="btn-ghost" onClick={cerrarForm}>✖</button>
            </div>
            <div className="modal-body">
              <label>Nombre</label>
              <input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />

              <label>Clasificación</label>
              <input value={formClasificacion} onChange={(e) => setFormClasificacion(e.target.value)} />

              <label>Información</label>
              <textarea value={formInformacion} onChange={(e) => setFormInformacion(e.target.value)} />

              <label>Rango</label>
              <input
                type="number"
                min={0}
                placeholder="(opcional) 1, 2, 3…"
                value={formRango}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormRango(v === "" ? "" : Math.max(0, Number(v)));
                }}
              />

              <label>Imagen (token)</label>
              <input
                placeholder="/tokens/strigoi.png o strigoi.png"
                value={formImagen}
                onChange={(e) => setFormImagen(e.target.value)}
              />

              {/* Eliminado el campo de 'Imagen de fondo' */}
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={cerrarForm}>Cancelar</button>
              <button className="btn-accent" onClick={guardarNpc}>{editing ? "Guardar cambios" : "Crear"}</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay{ position: fixed; inset:0; background: rgba(0,0,0,.55); display:grid; place-items:center; z-index:60; }
        .modal-card{ width:min(720px, 94vw); background: linear-gradient(180deg, #15111a, #120e16); border:1px solid #2c2233; border-radius:14px; box-shadow: var(--shadow); color: var(--ink); }
        .modal-head{ display:flex; align-items:center; justify-content:space-between; padding:.9rem 1rem; border-bottom:1px solid #2c2233; }
        .modal-body{ display:grid; gap:.6rem; padding:1rem; }
        .modal-body input, .modal-body textarea { background:#1c1721; border:1px solid #2c2233; border-radius:10px; color:var(--ink); padding:.55rem .7rem; }
        .modal-actions{ display:flex; gap:.6rem; justify-content:flex-end; padding:0 1rem 1rem; }
      `}</style>
    </section>
  );
}
