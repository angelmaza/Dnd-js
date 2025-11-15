// src/app/(sections)/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ImageUploader from "@/components/ImageUploader";

type Personaje = {
  id_pj: number;
  nombre: string;
  informacion: string | null;
  imagen: string | null;
  imagen_fondo: string | null;
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

export default function Page() {
  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [modalPjOpen, setModalPjOpen] = useState(false);
  const [newPj, setNewPj] = useState({ nombre: "", informacion: "" });

  // Modal de detalle
  const [viewing, setViewing] = useState<Personaje | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [dNombre, setDNombre] = useState("");
  const [dInformacion, setDInformacion] = useState("");
  const [dImagen, setDImagen] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r2 = await fetch("/api/personajes", { cache: "no-store" });
        if (r2.ok) setPersonajes(await r2.json());
      } catch {
        // opcional: manejar error
      }
    })();
  }, []);

  const hayPersonajes = personajes.length > 0;

  // ===== Crear personaje =====
  const crearPj = async () => {
    const body = {
      nombre: newPj.nombre.trim(),
      informacion: newPj.informacion.trim(),
      imagen: null,
      imagen_fondo: null, // se verá DEFAULT_BG si es null
    };
    if (!body.nombre) return;

    const res = await fetch("/api/personajes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const creado = await res.json();
      setPersonajes((prev) => [
        ...prev,
        {
          id_pj: creado.id,
          nombre: body.nombre,
          informacion: body.informacion,
          imagen: null,
          imagen_fondo: null,
        },
      ]);
      setModalPjOpen(false);
      setNewPj({ nombre: "", informacion: "" });
    }
  };

  // ===== Abrir modal de detalle =====
  const abrirDetalle = (p: Personaje) => {
    setViewing(p);
    setIsEditingDetail(false);
    setDNombre(p.nombre ?? "");
    setDInformacion(p.informacion ?? "");
    setDImagen(p.imagen ?? "");
  };

  // ===== Guardar edición inline del detalle (PUT /api/personajes/:id) =====
  const guardarDetalle = async () => {
    if (!viewing) return;
    const nombre = dNombre.trim();
    if (!nombre) return;

    const payload = {
      nombre,
      informacion: dInformacion.trim() || null,
      imagen: dImagen.trim() || null,
      // imagen_fondo NO se toca desde aquí
    };

    const res = await fetch(`/api/personajes/${viewing.id_pj}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setPersonajes((prev) =>
        prev.map((x) =>
          x.id_pj === viewing.id_pj
            ? { ...x, nombre: payload.nombre, informacion: payload.informacion, imagen: payload.imagen }
            : x
        )
      );
      setViewing((v) =>
        v ? { ...v, nombre: payload.nombre, informacion: payload.informacion, imagen: payload.imagen } : v
      );
      setIsEditingDetail(false);
    } else {
      const e = await res.json().catch(() => ({}));
      alert(e?.error ?? "Error guardando cambios");
    }
  };

  // ===== Eliminar PJ (DELETE /api/personajes/:id) =====
  const eliminarPj = async (id: number) => {
    if (!confirm("¿Eliminar este personaje?")) return;
    const res = await fetch(`/api/personajes/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPersonajes((prev) => prev.filter((p) => p.id_pj !== id));
      if (viewing?.id_pj === id) setViewing(null);
    } else {
      const e = await res.json().catch(() => ({}));
      alert(e?.error ?? "Error al eliminar");
    }
  };

  // ===== Grid de tarjetas (máximo 3 por fila) =====
  const gridCols = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))", // 3 columnas
      gap: "1rem",
      justifyItems: "center",
    }),
    []
  );

  // ===== Card vertical: Nombre (arriba), Icono (centro), Botón (abajo) =====
  const renderCard = (p: Personaje) => {
    const src = resolveImg(p.imagen);
    return (
          <div
            key={p.id_pj}
            className="panel"
            style={{ display: "flex", flexDirection: "column", width: "320px" }}
          >        
          {/* Arriba: Nombre */}
        <div className="panel-head" style={{ justifyContent: "center" }}>
          <h3 style={{ margin: 0, textAlign: "center" }}>{p.nombre}</h3>
        </div>

        {/* Centro: Icono/imagen circular grande */}
        <div style={{ padding: "1rem", display: "grid", placeItems: "center", flex: "1 1 auto" }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid #3a2d43",
              background: "#1c1721",
              display: "grid",
              placeItems: "center",
              fontSize: 48,
            }}
          >
            {src ? (
              <img
                alt={p.nombre}
                src={src}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              "🧝"
            )}
          </div>
        </div>

        {/* Abajo: Botón Ver */}
        <div style={{ padding: "0 1rem 1rem", display: "flex", justifyContent: "center" }}>
          <button className="btn-ghost" onClick={() => abrirDetalle(p)}>
            Ver
          </button>
        </div>
      </div>
    );
  };

  return (
    <section>
      <h1>Bienvenido a Barovia</h1>

      {/* PERSONAJES como tarjetas */}
      <div className="panel">
        <div className="panel-head">
          <h2>Personajes</h2>
          <button className="btn-accent" onClick={() => setModalPjOpen(true)}>
            Nuevo personaje
          </button>
        </div>

        <div className="table-wrap" style={{ padding: "1rem" }}>
          {!hayPersonajes ? (
            <div className="empty">
              <p>No hay datos todavía. Crea tu primer personaje.</p>
              <div className="actions">
                <button className="btn-ghost" onClick={() => setModalPjOpen(true)}>
                  Nuevo personaje
                </button>
              </div>
            </div>
          ) : (
            <div style={gridCols}>{personajes.map(renderCard)}</div>
          )}
        </div>
      </div>

      {/* MODAL: Nuevo Personaje */}
      {modalPjOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Nuevo personaje</h3>
              <button className="btn" onClick={() => setModalPjOpen(false)}>
                ✖
              </button>
            </div>
            <div className="modal-body">
              <label>Nombre</label>
              <input
                value={newPj.nombre}
                onChange={(e) => setNewPj({ ...newPj, nombre: e.target.value })}
              />
              <label>Información</label>
              <textarea
                value={newPj.informacion}
                onChange={(e) => setNewPj({ ...newPj, informacion: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setModalPjOpen(false)}>Cancelar</button>
              <button className="btn btn-accent" onClick={crearPj}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ver/Editar Personaje */}
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
              <h3>{isEditingDetail ? "Editar personaje" : viewing.nombre}</h3>
              <button className="btn-ghost" onClick={() => setViewing(null)}>✖</button>
            </div>

            <div className="modal-body" style={{ background: "rgba(18,14,22,.65)", borderTop: "1px solid #2c2233" }}>
              {/* Avatar grande */}
              <div style={{ display: "grid", placeItems: "center", marginBottom: ".8rem" }}>
                <div
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid #3a2d43",
                    background: "#1c1721",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {resolveImg(isEditingDetail ? dImagen : viewing.imagen) ? (
                    <img
                      alt={viewing.nombre}
                      src={resolveImg(isEditingDetail ? dImagen : viewing.imagen)!}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 56 }}>
                      🧝
                    </div>
                  )}
                </div>
              </div>

              {!isEditingDetail ? (
                <>
                  <p><b>Nombre:</b> {viewing.nombre}</p>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    <b>Información:</b><br />{viewing.informacion ?? "—"}
                  </p>

                  <div className="modal-actions right">
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setIsEditingDetail(true);
                        setDNombre(viewing.nombre ?? "");
                        setDInformacion(viewing.informacion ?? "");
                        setDImagen(viewing.imagen ?? "");
                      }}
                    >
                      Editar
                    </button>
                    <button className="btn-ghost" onClick={() => eliminarPj(viewing.id_pj)}>
                      Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label>Nombre</label>
                  <input value={dNombre} onChange={(e) => setDNombre(e.target.value)} />

                  <label>Información</label>
                  <textarea
                    value={dInformacion}
                    onChange={(e) => setDInformacion(e.target.value)}
                  />

                  <ImageUploader
                    label="Imagen del personaje"
                    onUploaded={(url) => setDImagen(url)}
                  />

                  <div className="modal-actions right">
                    <button className="btn-ghost" onClick={() => setIsEditingDetail(false)}>
                      Cancelar
                    </button>
                    <button className="btn-accent" onClick={guardarDetalle}>
                      Guardar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
