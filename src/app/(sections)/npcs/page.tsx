// src/app/(sections)/personajes/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ImageUploader from "@/components/ImageUploader";

type Npc = {
  id_npc: number;
  nombre: string | null;
  informacion: string | null;
  clasificacion: string | null;
  imagen: string | null;
  imagen_fondo: string | null;
  rango: number | null;
};

const DEFAULT_BG = "/images/Bosque.jpg";

/** Normaliza rutas de imagen para mostrar */
function resolveImg(v?: string | null) {
  if (!v) return null;
  const s = v.trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;
  if (s.startsWith("/")) return s;
  return `/tokens/${s}`;
}

export default function NpcsPage() {
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal crear
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form crear
  const [formNombre, setFormNombre] = useState("");
  const [formInformacion, setFormInformacion] = useState("");
  const [formClasificacion, setFormClasificacion] = useState("");
  const [formImagen, setFormImagen] = useState("");
  const [formRango, setFormRango] = useState<number | "">("");

  // Modal ver/editar detalle
  const [viewing, setViewing] = useState<Npc | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [dNombre, setDNombre] = useState("");
  const [dClasificacion, setDClasificacion] = useState("");
  const [dInformacion, setDInformacion] = useState("");
  const [dRango, setDRango] = useState<number | "">("");
  const [dImagen, setDImagen] = useState("");

  useEffect(() => {
    cargarNpcs();
  }, []);

  async function cargarNpcs() {
    setIsLoading(true);
    try {
      const r = await fetch("/api/npcs", { cache: "no-store" });
      if (r.ok) setNpcs(await r.json());
    } finally {
      setIsLoading(false);
    }
  }

  // ===== CREAR =====
  function abrirCrear() {
    setFormNombre("");
    setFormInformacion("");
    setFormClasificacion("");
    setFormImagen("");
    setFormRango("");
    setIsFormOpen(true);
  }
  function cerrarForm() {
    setIsFormOpen(false);
  }
  async function guardarNpcNuevo() {
    const nombre = formNombre.trim();
    if (!nombre) return;

    const rango = formRango === "" ? null : Math.max(0, Number(formRango) || 0);

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

    setIsFormOpen(false);
    await cargarNpcs();
  }

  // ===== ELIMINAR =====
  async function eliminarNpc(id: number) {
    if (!confirm("¿Eliminar este NPC?")) return;
    await fetch("/api/npcs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_npc: id }),
    });
    await cargarNpcs();
    if (viewing?.id_npc === id) setViewing(null);
  }

  // ===== AGRUPACIÓN =====
  const gridCols = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "1rem",
    }),
    []
  );

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

  // ===== TARJETAS =====
  const renderCard = (n: Npc) => {
    const src = resolveImg(n.imagen);
    return (
      <div
        key={n.id_npc}
        className="panel"
        style={{ margin: 0, cursor: "pointer" }}
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
              {src ? (
                <img
                  alt={n.nombre ?? ""}
                  src={src}
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
          <div className="muted" style={{ fontSize: 12 }}>
            Rango: {n.rango ?? "—"}
          </div>
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
  };

  const renderGrupoRango = (r: number) => {
    const grupo = npcs
      .filter((n) => (n.rango ?? 0) === r)
      .sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? ""));
    if (grupo.length === 0) return null;

    return (
      <div className="panel" key={`rango-${r}`}>
        <div className="panel-head">
          <h2>Rango {r}</h2>
          <span className="muted">
            {grupo.length} NPC{grupo.length !== 1 && "s"}
          </span>
        </div>
        <div className="table-wrap" style={{ padding: "1rem" }}>
          <div style={gridCols}>{grupo.map(renderCard)}</div>
        </div>
      </div>
    );
  };

  // ===== EDICIÓN INLINE EN EL MODAL DE DETALLE =====
  function startDetailEdit(n: Npc) {
    setDNombre(n.nombre ?? "");
    setDClasificacion(n.clasificacion ?? "");
    setDInformacion(n.informacion ?? "");
    setDRango(n.rango ?? "");
    setDImagen(n.imagen ?? "");
    setIsEditingDetail(true);
  }

  function cancelDetailEdit() {
    setIsEditingDetail(false);
  }

  async function saveDetailEdit() {
    if (!viewing) return;
    const nombre = dNombre.trim();
    if (!nombre) return;

    const rango = dRango === "" ? null : Math.max(0, Number(dRango) || 0);
    const payload = {
      id_npc: viewing.id_npc,
      nombre,
      clasificacion: dClasificacion.trim() || null,
      informacion: dInformacion.trim() || null,
      imagen: dImagen.trim() || null,
      // imagen_fondo NO se toca aquí
      rango,
    };

    const res = await fetch("/api/npcs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      // Actualizar estado local sin recargar todo
      setNpcs((prev) =>
        prev.map((x) =>
          x.id_npc === viewing.id_npc
            ? {
                ...x,
                nombre: payload.nombre,
                clasificacion: payload.clasificacion,
                informacion: payload.informacion,
                imagen: payload.imagen,
                rango: payload.rango,
              }
            : x
        )
      );
      // Reflejar en el modal abierto
      setViewing((v) =>
        v
          ? {
              ...v,
              nombre: payload.nombre,
              clasificacion: payload.clasificacion,
              informacion: payload.informacion,
              imagen: payload.imagen,
              rango: payload.rango,
            }
          : v
      );
      setIsEditingDetail(false);
    } else {
      const e = await res.json().catch(() => ({}));
      alert(e?.error ?? "Error guardando cambios");
    }
  }

  return (
    <section className="detail-wrap">
      <div className="panel">
        <div className="panel-head">
          <h2>NPCs</h2>
          <button className="btn-accent" onClick={abrirCrear}>
            Nuevo NPC
          </button>
        </div>
      </div>

      {!isLoading && ranks.map((r) => renderGrupoRango(r))}

      {!isLoading && sinRango.length > 0 && (
        <div className="panel" key="rango-none">
          <div className="panel-head">
            <h2>Sin rango</h2>
            <span className="muted">
              {sinRango.length} NPC{sinRango.length !== 1 && "s"}
            </span>
          </div>
          <div className="table-wrap" style={{ padding: "1rem" }}>
            <div style={gridCols}>{sinRango.map(renderCard)}</div>
          </div>
        </div>
      )}

      {/* MODAL: Ver detalle + Edición inline */}
      {viewing && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{
              backgroundImage: `url(${
                viewing.imagen_fondo
                  ? viewing.imagen_fondo.startsWith("/")
                    ? viewing.imagen_fondo
                    : `/images/${viewing.imagen_fondo}`
                  : DEFAULT_BG
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="modal-head" style={{ background: "rgba(0,0,0,.35)" }}>
              <h3>{isEditingDetail ? "Editar NPC" : viewing.nombre}</h3>
              <button className="btn-ghost" onClick={() => setViewing(null)}>
                ✖
              </button>
            </div>

            <div
              className="modal-body"
              style={{ background: "rgba(18,14,22,.65)", borderTop: "1px solid #2c2233" }}
            >
              {/* Avatar */}
              <div style={{ display: "grid", placeItems: "center", marginBottom: ".8rem" }}>
                <div
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid #3a2d43",
                    background: "#1c1721",
                  }}
                >
                  {resolveImg(isEditingDetail ? dImagen : viewing.imagen) ? (
                    <img
                      alt={viewing.nombre ?? ""}
                      src={resolveImg(isEditingDetail ? dImagen : viewing.imagen)!}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        placeItems: "center",
                        height: "100%",
                        fontSize: 56,
                      }}
                    >
                      🧛
                    </div>
                  )}
                </div>
              </div>

              {/* Campos lectura o edición */}
              {!isEditingDetail ? (
                <>
                  <p>
                    <b>Rango:</b> {viewing.rango ?? "—"}
                  </p>
                  <p>
                    <b>Clasificación:</b> {viewing.clasificacion ?? "—"}
                  </p>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    <b>Información:</b>
                    <br />
                    {viewing.informacion ?? "—"}
                  </p>

                  <div style={{ display: "flex", gap: ".4rem", justifyContent: "flex-end" }}>
                    <button className="btn-ghost" onClick={() => startDetailEdit(viewing)}>
                      Editar
                    </button>
                    <button className="btn-ghost" onClick={() => eliminarNpc(viewing.id_npc)}>
                      Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label>Nombre</label>
                  <input value={dNombre} onChange={(e) => setDNombre(e.target.value)} />

                  <label>Clasificación</label>
                  <input
                    value={dClasificacion}
                    onChange={(e) => setDClasificacion(e.target.value)}
                  />

                  <label>Información</label>
                  <textarea
                    value={dInformacion}
                    onChange={(e) => setDInformacion(e.target.value)}
                  />

                  <label>Rango</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="(opcional) 1, 2, 3…"
                    value={dRango}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDRango(v === "" ? "" : Math.max(0, Number(v)));
                    }}
                  />

                  <ImageUploader
                    label="Imagen (token/NPC)"
                    onUploaded={(url) => setDImagen(url)}
                  />

                  <div style={{ display: "flex", gap: ".4rem", justifyContent: "flex-end" }}>
                    <button className="btn-ghost" onClick={cancelDetailEdit}>
                      Cancelar
                    </button>
                    <button className="btn-accent" onClick={saveDetailEdit}>
                      Guardar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear (solo para nuevos, edición ya es inline en detalle) */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Nuevo NPC</h3>
              <button className="btn-ghost" onClick={cerrarForm}>
                ✖
              </button>
            </div>
            <div className="modal-body">
              <label>Nombre</label>
              <input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />

              <label>Clasificación</label>
              <input
                value={formClasificacion}
                onChange={(e) => setFormClasificacion(e.target.value)}
              />

              <label>Información</label>
              <textarea
                value={formInformacion}
                onChange={(e) => setFormInformacion(e.target.value)}
              />

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

              <ImageUploader label="Imagen (token/NPC)" onUploaded={(url) => setFormImagen(url)} />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={cerrarForm}>
                Cancelar
              </button>
              <button className="btn-accent" onClick={guardarNpcNuevo}>
                Crear
              </button>
            </div>
          </div>
        </div>
      )}


    </section>
  );
}
