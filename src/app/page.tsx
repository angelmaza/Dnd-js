// src/app/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";

type Lore = {
  id_lore: number;
  titulo: string;
  texto: string | null;
};

export default function Page() {
  const [lore, setLore] = useState<Lore[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Crear
  const [newTitulo, setNewTitulo] = useState("");
  const [newTexto, setNewTexto] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Editar
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editTexto, setEditTexto] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ===== CARGAR LORE =====
  async function loadLore() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/lore", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar el lore");
      const data: Lore[] = await res.json();
      setLore(data);
    } catch (err) {
      console.error(err);
      setError("No se ha podido cargar el lore.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLore();
  }, []);

  const hasLore = lore.length > 0;

  // ===== CREAR NUEVO =====
  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const titulo = newTitulo.trim();
    const texto = newTexto.trim() || null;

    if (!titulo) {
      setCreateError("El título es obligatorio.");
      return;
    }

    try {
      setCreating(true);

      const res = await fetch("/api/lore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, texto }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data.error || "No se pudo crear el capítulo.");
      }

      const created = (await res.json()) as Lore;

      setLore((prev) => [...prev, created]);
      setNewTitulo("");
      setNewTexto("");
      setCreateOpen(false);
      setOpenId(created.id_lore);
    } catch (err) {
      console.error(err);
      setCreateError("Error al crear el capítulo.");
    } finally {
      setCreating(false);
    }
  }

  // ===== EDITAR =====
  function startEdit(entry: Lore) {
    setEditingId(entry.id_lore);
    setEditTitulo(entry.titulo);
    setEditTexto(entry.texto ?? "");
    setEditError(null);
    setOpenId(entry.id_lore);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitulo("");
    setEditTexto("");
    setEditError(null);
  }

  async function handleSaveEdit(e: FormEvent, entry: Lore) {
    e.preventDefault();
    setEditError(null);

    const titulo = editTitulo.trim();
    const texto = editTexto.trim() || null;

    if (!titulo) {
      setEditError("El título no puede quedar vacío.");
      return;
    }

    try {
      setSavingEdit(true);

      const res = await fetch("/api/lore", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_lore: entry.id_lore,
          titulo,
          texto,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data.error || "No se pudo guardar la edición.");
      }

      setLore((prev) =>
        prev.map((l) =>
          l.id_lore === entry.id_lore ? { ...l, titulo, texto } : l
        )
      );

      setEditingId(null);
      setEditTitulo("");
      setEditTexto("");
    } catch (err) {
      console.error(err);
      setEditError("Error al guardar cambios.");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <section>
      <h1>Crónicas de Barovia</h1>

      {/* LISTA LORE */}
      <div className="panel">
        <div className="panel-head">
          <h2>Registro de Lore</h2>
          {hasLore && (
            <span className="muted">
              {lore.length} entrada{lore.length !== 1 && "s"}
            </span>
          )}
        </div>

        <div className="lore-list">
          {loading && <div className="empty">Cargando capítulos...</div>}

          {!loading && error && <div className="empty">{error}</div>}

          {!loading && !error && !hasLore && (
            <div className="empty">
              Aún no hay historias registradas.
              <div className="actions">
                <span className="muted">
                  Cuando descubráis algo digno de temer, anotadlo aquí.
                </span>
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            hasLore &&
            lore.map((entry) => {
              const isOpen = openId === entry.id_lore;
              const isEditing = editingId === entry.id_lore;

              return (
                <article
                  key={entry.id_lore}
                  className={`lore-item ${isOpen ? "open" : ""}`}
                >
                  <button
                    type="button"
                    className="lore-toggle"
                    onClick={() =>
                      setOpenId(isOpen ? null : entry.id_lore)
                    }
                  >
                    <span className="lore-title">{entry.titulo}</span>
                    <span className="lore-icon">
                      {isOpen ? "▾" : "▸"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="lore-body">
                      {!isEditing && (
                        <>
                          <p className="lore-text">
                            {entry.texto?.trim() ||
                              "Sin detalles registrados."}
                          </p>
                          <div className="media-actions">
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => startEdit(entry)}
                            >
                              Editar capítulo
                            </button>
                          </div>
                        </>
                      )}

                      {isEditing && (
                        <form
                          onSubmit={(e) => handleSaveEdit(e, entry)}
                          className="lore-edit-form"
                        >
                          <input
                            type="text"
                            value={editTitulo}
                            onChange={(e) =>
                              setEditTitulo(e.target.value)
                            }
                            className="lore-input"
                            placeholder="Título del capítulo"
                          />
                          <textarea
                            value={editTexto}
                            onChange={(e) =>
                              setEditTexto(e.target.value)
                            }
                            className="lore-textarea"
                            placeholder="Escribe aquí el relato..."
                            rows={4}
                          />
                          {editError && (
                            <p className="muted" style={{ color: "#fca5a5" }}>
                              {editError}
                            </p>
                          )}
                          <div className="media-actions">
                            <button
                              type="submit"
                              className="btn-accent"
                              disabled={savingEdit}
                            >
                              {savingEdit
                                ? "Guardando..."
                                : "Guardar cambios"}
                            </button>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={cancelEdit}
                              disabled={savingEdit}
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
        </div>
      </div>

      {/* CREAR NUEVO (PLEGABLE) */}
      <div className="panel">
        <div className="panel-head">
          <h2>Nuevo capítulo</h2>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setCreateOpen((v) => !v)}
          >
            {createOpen ? "Ocultar" : "Añadir"}
          </button>
        </div>

        {createOpen && (
          <form onSubmit={handleCreate} className="lore-create-form">
            <input
              type="text"
              value={newTitulo}
              onChange={(e) => setNewTitulo(e.target.value)}
              placeholder="Título del capítulo"
              className="lore-input"
            />
            <textarea
              value={newTexto}
              onChange={(e) => setNewTexto(e.target.value)}
              placeholder="Texto del capítulo..."
              rows={4}
              className="lore-textarea"
            />
            {createError && (
              <p className="muted" style={{ color: "#fca5a5" }}>
                {createError}
              </p>
            )}
            <div className="media-actions">
              <button
                type="submit"
                className="btn-accent"
                disabled={creating}
              >
                {creating
                  ? "Sellando capítulo..."
                  : "Guardar capítulo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
