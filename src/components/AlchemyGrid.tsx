"use client";

import { useState } from "react";

type RecetaGrid = {
  NombreProducto: string;
  Descripcion: string | null;
  Elementos: { NombreElemento: string; ProporcionElemento: number }[];
};

const MAX_ELEM = 5;

export function AlchemyGrid({
  recetas,
  colores,
  onCraft,
  onDelete,
  onNuevaReceta,
  elementosDisponibles,
  bases,
}: {
  recetas: RecetaGrid[];
  colores: Map<string, string>;
  onCraft: (r: RecetaGrid) => void;
  onDelete: (r: RecetaGrid) => void;
  onNuevaReceta: (r: RecetaGrid) => void;
  elementosDisponibles: string[];
  bases: string[];
}) {
  /* ===== Modal de nueva receta ===== */
  const [open, setOpen] = useState(false);
  const [nueva, setNueva] = useState<RecetaGrid>({
    NombreProducto: "",
    Descripcion: "",
    Elementos: Array.from({ length: MAX_ELEM }, () => ({
      NombreElemento: "",
      ProporcionElemento: 0,
    })),
  });

  const resetNueva = () =>
    setNueva({
      NombreProducto: "",
      Descripcion: "",
      Elementos: Array.from({ length: MAX_ELEM }, () => ({
        NombreElemento: "",
        ProporcionElemento: 0,
      })),
    });

  const guardar = () => {
    const base = nueva.Elementos[MAX_ELEM - 1];
    if (bases.includes(base.NombreElemento)) base.ProporcionElemento = 1;

    onNuevaReceta(nueva);
    resetNueva();
    setOpen(false);
  };

  return (
    <>
      <div className="alchemy-grid">

        {/* ===== BOTÓN AÑADIR ===== */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: ".4rem" }}>
          <button className="btn-accent" onClick={() => setOpen(true)}>
            + Añadir receta
          </button>
        </div>

        {/* HEADER */}
        <div className="alchemy-grid-row alchemy-grid-header">
          <div>Producto</div>
          <div>Descripción</div>
          <div>Ingredientes</div>
          <div>Base</div>
          <div></div>
        </div>

        {/* FILAS */}
        {recetas.map((r, idx) => (
          <div key={idx} className="alchemy-grid-row">
            <div className="ag-cell strong">{r.NombreProducto}</div>
            <div className="ag-cell muted">{r.Descripcion || "—"}</div>

            <div className="ag-cell">
              <div className="ag-ings">
                {r.Elementos.slice(0, MAX_ELEM - 1).map((el, i) =>
                  el.NombreElemento ? (
                    <span
                      key={i}
                      className="ag-ing"
                      style={{
                        background: colores.get(el.NombreElemento) || "#333",
                      }}
                    >
                      {el.NombreElemento} → {el.ProporcionElemento}
                    </span>
                  ) : null
                )}
              </div>
            </div>

            {/* BASE */}
            <div className="ag-cell">
              {(() => {
                const base = r.Elementos[MAX_ELEM - 1];
                return base.NombreElemento ? (
                  <span
                    className="ag-ing"
                    style={{
                      background: colores.get(base.NombreElemento) || "#333",
                    }}
                  >
                    {base.NombreElemento}
                  </span>
                ) : (
                  "—"
                );
              })()}
            </div>

            {/* ACCIONES */}
            <div className="ag-actions">
              <button className="btn-accent" onClick={() => onCraft(r)}>Craft</button>
              <button className="btn-ghost" onClick={() => onDelete(r)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>



      {/* ====================================================
           MODAL NUEVA RECETA
      ===================================================== */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nueva Receta</h3>
              <button className="btn-ghost" onClick={() => setOpen(false)}>X</button>
            </div>

            <div className="modal-body">
              <input
                value={nueva.NombreProducto}
                placeholder="Nombre del producto"
                onChange={(e) => setNueva({ ...nueva, NombreProducto: e.target.value })}
              />

              <textarea
                value={nueva.Descripcion || ""}
                placeholder="Descripción"
                onChange={(e) => setNueva({ ...nueva, Descripcion: e.target.value })}
              />

              {/* INGREDIENTES */}
              {Array.from({ length: MAX_ELEM }).map((_, i) => {
                const isBase = i === MAX_ELEM - 1;
                const el = nueva.Elementos[i];

                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: ".4rem" }}>
                    <select
                      className="btn"
                      value={el.NombreElemento}
                      onChange={(e) => {
                        const copy = [...nueva.Elementos];
                        copy[i].NombreElemento = e.target.value;
                        setNueva({ ...nueva, Elementos: copy });
                      }}
                    >
                      <option value="">{isBase ? "Base" : "Elemento"}</option>

                      {(isBase ? bases : elementosDisponibles).map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>

                    {!isBase && (
                      <input
                        type="number"
                        value={el.ProporcionElemento}
                        style={{margin:"0"}}

                        onChange={(e) => {
                          const copy = [...nueva.Elementos];
                          copy[i].ProporcionElemento = Number(e.target.value || 0);
                          setNueva({ ...nueva, Elementos: copy });
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn-accent" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
