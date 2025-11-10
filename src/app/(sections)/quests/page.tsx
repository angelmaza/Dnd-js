// src/app/(sections)/misiones/page.tsx
"use client";

import { useEffect, useState } from "react";

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

  // Form state
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
  const pendientes = misiones.filter((m) => m.completada === 0);
  const completadas = misiones.filter((m) => m.completada === 1);

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

  // ===== GUARDAR (CREAR / EDITAR) =====
  async function guardarMision() {
    setFormError(null);

    const titulo = formTitulo.trim();
    if (!titulo) {
      setFormError("El título es obligatorio.");
      return;
    }

    const completadaValue: 0 | 1 = formCompletada ? 1 : 0;

    const payload = {
      titulo,
      zona: formZona.trim() || null,
      npc: formNpc.trim() || null,
      descripcion: formDescripcion.trim() || null,
      importancia:
        formImportancia === "" ? null : Number(formImportancia),
      recompensa: formRecompensa.trim() || null,
      completada: completadaValue,
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

        // Actualizar en estado
        setMisiones((prev) =>
          prev.map((m) =>
            m.id_mision === editing.id_mision ? { ...m, ...payload } : m
          )
        );

        // Si estaba abierta en el modal de ver, actualizar también
        if (viewing && viewing.id_mision === editing.id_mision) {
          setViewing((prev) => (prev ? { ...prev, ...payload } : prev));
        }
      } else {
        // POST /api/misiones → { id }
        const res = await fetch("/api/misiones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Error al crear misión.");
        }

        const data = await res.json(); // { id }

        const nueva: Mision = {
          id_mision: data.id,
          titulo: payload.titulo,
          zona: payload.zona,
          npc: payload.npc,
          descripcion: payload.descripcion,
          importancia: payload.importancia,
          recompensa: payload.recompensa,
          completada: completadaValue,
        };

        setMisiones((prev) => [...prev, nueva]);
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

      if (viewing?.id_mision === m.id_mision) {
        setViewing(null);
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar la misión.");
    }
  }

  // ===== RENDER =====
  return (
    <section className="detail-wrap">
      {/* PANEL: MISIONES PENDIENTES */}
      <div className="panel">
        <div className="panel-head">
          <h2>Misiones pendientes</h2>
          <button className="btn-accent" onClick={abrirCrear}>
            Nueva misión
          </button>
        </div>

        <div className="table-wrap misiones-wrap">
          {isLoading ? (
            <div className="empty">
              <p>Cargando encargos de Barovia…</p>
            </div>
          ) : !hayMisiones || pendientes.length === 0 ? (
            <div className="empty">
              <p>No hay misiones en curso.</p>
              <div className="actions">
                <button className="btn-accent" onClick={abrirCrear}>
                  Registrar nueva misión
                </button>
              </div>
            </div>
          ) : (
            <div className="misiones-grid">
              {pendientes.map((m) => (
                <div
                  key={m.id_mision}
                  className="mission-card"
                  onClick={() => abrirVer(m)}
                >
                  <div className="mission-card-head">
                    <div className="mission-card-titles">
                      <div className="mission-card-title">
                        {m.titulo}
                      </div>
                      <div className="mission-card-sub">
                        {m.zona || "Zona desconocida"} ·{" "}
                        {m.npc || "Sin contacto"}
                      </div>
                    </div>
                    <div className="mission-card-tags">
                      <span>⏳ En curso</span>
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

        {formError && !isLoading && (
          <div className="empty">
            <p className="error-text">{formError}</p>
          </div>
        )}
      </div>

      {/* PANEL: MISIONES COMPLETADAS (solo si hay misiones en general) */}
      {hayMisiones && (
        <div className="panel">
          <div className="panel-head">
            <h2>Misiones completadas</h2>
            <span className="muted">
              {completadas.length} completada
              {completadas.length !== 1 && "s"}
            </span>
          </div>

          <div className="table-wrap misiones-wrap">
            {isLoading ? (
              <div className="empty">
                <p>Cargando…</p>
              </div>
            ) : completadas.length === 0 ? (
              <div className="empty">
                <p>
                  Ningún héroe ha cerrado todavía estos capítulos.
                </p>
              </div>
            ) : (
              <div className="misiones-grid">
                {completadas.map((m) => (
                  <div
                    key={m.id_mision}
                    className="mission-card completed"
                    onClick={() => abrirVer(m)}
                  >
                    <div className="mission-card-head">
                      <div className="mission-card-titles">
                        <div className="mission-card-title">
                          {m.titulo}
                        </div>
                        <div className="mission-card-sub">
                          {m.zona || "Zona desconocida"} ·{" "}
                          {m.npc || "Sin contacto"}
                        </div>
                      </div>
                      <div className="mission-card-tags">
                        <span>✔ Completada</span>
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
      )}

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
              <p className="mission-desc">
                <b>Descripción:</b>
                <br />
                {viewing.descripcion || "Sin detalles."}
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn-ghost"
                onClick={() => {
                  cerrarVer();
                  abrirEditar(viewing);
                }}
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
              <h3>{editing ? "Editar misión" : "Nueva misión"}</h3>
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

              <label className="checkbox-row">
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
                <p className="error-text">
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
    </section>
  );
}
