// src/app/(sections)/misiones/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Mision = {
  id_mision: number;
  titulo: string;
  zona: string | null;
  npc: string | null;
  descripcion: string | null;
  importancia: number | null;
  recompensa: string | null;
  completada: 0 | 1;
};

export default function MisionesPage() {
  const [misiones, setMisiones] = useState<Mision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal ver detalle
  const [viewing, setViewing] = useState<Mision | null>(null);

  // Modal crear / editar
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Mision | null>(null);

  // Estado formulario
  const [formTitulo, setFormTitulo] = useState("");
  const [formZona, setFormZona] = useState("");
  const [formNpc, setFormNpc] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formImportancia, setFormImportancia] = useState<number | "">("");
  const [formRecompensa, setFormRecompensa] = useState("");
  const [formCompletada, setFormCompletada] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ===== CARGAR MISIONES =====
  useEffect(() => {
    cargarMisiones();
  }, []);

  async function cargarMisiones() {
    setIsLoading(true);
    setFormError(null);
    try {
      const r = await fetch("/api/misiones", { cache: "no-store" });
      if (!r.ok) throw new Error("No se pudo cargar misiones");
      const data: Mision[] = await r.json();
      setMisiones(data);
    } catch (err) {
      console.error(err);
      setFormError("No se pudieron cargar las misiones.");
    } finally {
      setIsLoading(false);
    }
  }

  const hayMisiones = misiones.length > 0;

  // ===== VER DETALLE (MODAL) =====
  function abrirVer(m: Mision) {
    setViewing(m);
  }

  function cerrarVer() {
    setViewing(null);
  }

  // ===== CREAR / EDITAR (MODAL) =====
  function abrirCrear() {
    setEditing(null);
    setFormTitulo("");
    setFormZona("");
    setFormNpc("");
    setFormDescripcion("");
    setFormImportancia("");
    setFormRecompensa("");
    setFormCompletada(false);
    setFormError(null);
    setIsFormOpen(true);
  }

  function abrirEditar(m: Mision) {
    setEditing(m);
    setFormTitulo(m.titulo);
    setFormZona(m.zona ?? "");
    setFormNpc(m.npc ?? "");
    setFormDescripcion(m.descripcion ?? "");
    setFormImportancia(m.importancia ?? "");
    setFormRecompensa(m.recompensa ?? "");
    setFormCompletada(m.completada === 1);
    setFormError(null);
    setIsFormOpen(true);
  }

  function cerrarForm() {
    setIsFormOpen(false);
    setEditing(null);
  }

  async function guardarMision() {
    setFormError(null);

    const titulo = formTitulo.trim();
    if (!titulo) {
      setFormError("El título es obligatorio.");
      return;
    }

    const payload = {
      titulo,
      zona: formZona.trim() || null,
      npc: formNpc.trim() || null,
      descripcion: formDescripcion.trim() || null,
      importancia:
        formImportancia === "" ? null : Number(formImportancia),
      recompensa: formRecompensa.trim() || null,
      completada: formCompletada ? 1 : 0 as 0 | 1,
    };

    try {
      setSaving(true);

      if (editing) {
        // PUT /api/misiones/[id]
        const res = await fetch(`/api/misiones/${editing.id_mision}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Error al actualizar misión.");
        }

        // Actualizar en memoria
        setMisiones((prev) =>
          prev.map((m) =>
            m.id_mision === editing.id_mision
              ? { ...m, ...payload }
              : m
          )
        );
      } else {
        // POST /api/misiones
        const res = await fetch("/api/misiones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Error al crear misión.");
        }

        const creada = (await res.json()) as Mision;
        setMisiones((prev) => [...prev, creada]);
      }

      setIsFormOpen(false);
      setEditing(null);
    } catch (err) {
      console.error(err);
      setFormError(
        editing
          ? "No se pudo guardar la misión."
          : "No se pudo crear la misión."
      );
    } finally {
      setSaving(false);
    }
  }

  // ===== ELIMINAR =====
  async function eliminarMision(m: Mision) {
    if (!confirm(`¿Eliminar misión "${m.titulo}"?`)) return;

    try {
      const res = await fetch(`/api/misiones/${m.id_mision}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar misión.");
      }

      setMisiones((prev) =>
        prev.filter((x) => x.id_mision !== m.id_mision)
      );
      if (viewing?.id_mision === m.id_mision) setViewing(null);
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar la misión.");
    }
  }

  const gridCols = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      gap: ".4rem",
    }),
    []
  );

  return (
    <section className="detail-wrap">
      <div className="panel">
        <div className="panel-head">
          <h2>Misiones</h2>
          <button className="btn-accent" onClick={abrirCrear}>
            Nueva misión
          </button>
        </div>

        <div className="table-wrap" style={{ padding: "0.75rem 1rem 1rem" }}>
          {isLoading ? (
            <div className="empty">
              <p>Cargando encargos de Barovia…</p>
            </div>
          ) : !hayMisiones ? (
            <div className="empty">
              <p>No hay misiones todavía.</p>
              <div className="actions">
                <button className="btn-accent" onClick={abrirCrear}>
                  Registrar primera misión
                </button>
              </div>
            </div>
          ) : (
            <div style={gridCols}>
              {misiones.map((m) => (
                <div
                  key={m.id_mision}
                  className="panel"
                  style={{
                    margin: 0,
                    cursor: "pointer",
                    borderColor:
                      m.completada === 1 ? "#14532d" : "#2c2233",
                    background:
                      m.completada === 1
                        ? "linear-gradient(180deg, #111827, #020817)"
                        : "rgba(0,0,0,.18)",
                  }}
                  onClick={() => abrirVer(m)} // 👈 SOLO abre modal
                >
                  <div className="panel-head" style={{ padding: ".6rem .8rem" }}>
                    <div>
                      <div
                        style={{
                          fontFamily: "Cinzel, serif",
                          fontWeight: 600,
                          fontSize: ".98rem",
                        }}
                      >
                        {m.titulo}
                      </div>
                      <div className="muted" style={{ fontSize: ".78rem" }}>
                        {m.zona || "Zona desconocida"} ·{" "}
                        {m.npc || "Sin contacto"}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: ".2rem",
                        fontSize: ".75rem",
                      }}
                    >
                      <span>
                        {m.completada === 1
                          ? "✔ Completada"
                          : "⏳ En curso"}
                      </span>
                      {m.importancia != null && (
                        <span>Importancia: {m.importancia}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Ver detalle */}
      {viewing && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head">
              <h3>{viewing.titulo}</h3>
              <button className="btn-ghost" onClick={cerrarVer}>
                ✖
              </button>
            </div>
            <div className="modal-body">
              <p className="muted">
                {viewing.completada === 1
                  ? "✔ Misión completada."
                  : "⏳ Misión en curso."}
              </p>
              <p>
                <b>Zona:</b> {viewing.zona || "—"}
              </p>
              <p>
                <b>NPC:</b> {viewing.npc || "—"}
              </p>
              <p>
                <b>Importancia:</b>{" "}
                {viewing.importancia ?? "—"}
              </p>
              <p>
                <b>Recompensa:</b>{" "}
                {viewing.recompensa || "—"}
              </p>
              <p
                style={{ whiteSpace: "pre-wrap", marginTop: ".5rem" }}
              >
                <b>Descripción:</b>
                <br />
                {viewing.descripcion || "Sin detalles."}
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn-ghost"
                onClick={() => abrirEditar(viewing)}
              >
                Editar
              </button>
              <button
                className="btn-ghost"
                onClick={() => eliminarMision(viewing)}
              >
                Eliminar
              </button>
              <button className="btn" onClick={cerrarVer}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear / Editar */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head">
              <h3>
                {editing ? "Editar misión" : "Nueva misión"}
              </h3>
              <button className="btn-ghost" onClick={cerrarForm}>
                ✖
              </button>
            </div>
            <div className="modal-body">
              <label>Título</label>
              <input
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
              />

              <label>Zona</label>
              <input
                value={formZona}
                onChange={(e) => setFormZona(e.target.value)}
              />

              <label>NPC</label>
              <input
                value={formNpc}
                onChange={(e) => setFormNpc(e.target.value)}
              />

              <label>Descripción</label>
              <textarea
                value={formDescripcion}
                onChange={(e) =>
                  setFormDescripcion(e.target.value)
                }
              />

              <label>Importancia</label>
              <input
                type="number"
                min={0}
                max={10}
                value={formImportancia}
                onChange={(e) =>
                  setFormImportancia(
                    e.target.value === ""
                      ? ""
                      : Number(e.target.value)
                  )
                }
              />

              <label>Recompensa</label>
              <input
                value={formRecompensa}
                onChange={(e) =>
                  setFormRecompensa(e.target.value)
                }
              />

              <label style={{ display: "flex", gap: ".4rem" }}>
                <input
                  type="checkbox"
                  checked={formCompletada}
                  onChange={(e) =>
                    setFormCompletada(e.target.checked)
                  }
                />
                Marcar como completada
              </label>

              {formError && (
                <p
                  className="muted"
                  style={{ color: "#fca5a5" }}
                >
                  {formError}
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn-ghost"
                onClick={cerrarForm}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="btn-accent"
                onClick={guardarMision}
                disabled={saving}
              >
                {saving
                  ? "Guardando..."
                  : editing
                  ? "Guardar cambios"
                  : "Crear misión"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* estilos locales para modales, puedes moverlos a globals.css */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: grid;
          place-items: center;
          z-index: 60;
        }
        .modal-card {
          width: min(720px, 94vw);
          background: linear-gradient(
            180deg,
            #15111a,
            #120e16
          );
          border: 1px solid #2c2233;
          border-radius: 14px;
          box-shadow: var(--shadow);
          color: var(--ink);
        }
        .modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9rem 1rem;
          border-bottom: 1px solid #2c2233;
        }
        .modal-body {
          display: grid;
          gap: 0.6rem;
          padding: 1rem;
        }
        .modal-body input,
        .modal-body textarea {
          background: #1c1721;
          border: 1px solid #2c2233;
          border-radius: 10px;
          color: var(--ink);
          padding: 0.55rem 0.7rem;
        }
        .modal-actions {
          display: flex;
          gap: 0.6rem;
          justify-content: flex-end;
          padding: 0 1rem 1rem;
        }
      `}</style>
    </section>
  );
}
