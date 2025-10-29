"use client";

import { useEffect, useMemo, useState } from "react";

/* ===== Tipos ===== */
type EquipajeFila = {
  id_pj: number;
  Personaje: string | null;
  IdItemOPocion: number;
  Nombre: string | null;
  info_item: string | null;
  Toxicidad: number | null;
  Cantidad: number;
  Tipo: "Item" | "Pocion";
};

type Personaje = { id_pj: number; nombre: string };

type GrupoEquipaje = {
  id_pj: number;
  personaje: string;
  items: EquipajeFila[];
};

type IntercambioItemDto = {
  IdPjOrigen: number;
  IdPjDestino: number;
  IdItem: number;
  Cantidad: number;
  Tipo: "Item" | "Pocion";
};

/* ===== Página ===== */
export default function EquipajePage() {
  const [filasEquipaje, setFilasEquipaje] = useState<EquipajeFila[]>([]);
  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [gruposEquipaje, setGruposEquipaje] = useState<GrupoEquipaje[]>([]);

  // Modal Añadir
  const [modalAñadirAbierto, setModalAñadirAbierto] = useState(false);
  const [personajeParaAñadir, setPersonajeParaAñadir] = useState<number | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevaCantidad, setNuevaCantidad] = useState(1);
  const [nuevoTipo, setNuevoTipo] = useState<"Item" | "Pocion">("Item");

  // Modal Intercambio
  const [modalIntercambioAbierto, setModalIntercambioAbierto] = useState(false);
  const [registroParaIntercambio, setRegistroParaIntercambio] = useState<EquipajeFila | null>(null);
  const [destinoIntercambio, setDestinoIntercambio] = useState(0);
  const [cantidadIntercambio, setCantidadIntercambio] = useState(1);

  /* ===== Carga inicial ===== */
  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const [rEquipaje, rPersonajes] = await Promise.all([
      fetch("/api/equipaje", { cache: "no-store" }),
      fetch("/api/personajes", { cache: "no-store" }),
    ]);

    if (rEquipaje.ok) setFilasEquipaje(await rEquipaje.json());
    if (rPersonajes.ok) setPersonajes(await rPersonajes.json());
  }

  /* ===== Agrupar por personaje =====
     Base: lista de PERSONAJES. Si no hay filas de equipaje, cada grupo tendrá items []
  */
  useEffect(() => {
    // Indexar filas por id_pj
    const itemsPorPj = new Map<number, EquipajeFila[]>();
    for (const f of filasEquipaje) {
      if (!itemsPorPj.has(f.id_pj)) itemsPorPj.set(f.id_pj, []);
      itemsPorPj.get(f.id_pj)!.push(f);
    }

    // Si tenemos personajes, los usamos de base.
    // Si aún no cargaron, caemos a lo anterior (solo equipaje).
    let grupos: GrupoEquipaje[];
    if (personajes.length > 0) {
      grupos = personajes.map((p) => ({
        id_pj: p.id_pj,
        personaje: p.nombre ?? `PJ ${p.id_pj}`,
        items: itemsPorPj.get(p.id_pj) ?? [],
      }));
    } else {
      // Fallback por si tarda en cargar personajes
      const mapa = new Map<number, GrupoEquipaje>();
      for (const fila of filasEquipaje) {
        const id = fila.id_pj;
        if (!mapa.has(id)) {
          mapa.set(id, { id_pj: id, personaje: fila.Personaje ?? `PJ ${id}`, items: [] });
        }
        mapa.get(id)!.items.push(fila);
      }
      grupos = Array.from(mapa.values());
    }

    setGruposEquipaje(grupos);
  }, [filasEquipaje, personajes]);

  /* ===== Acciones: suma / resta / eliminar ===== */
  async function incrementarCantidad(registro: EquipajeFila) {
    const cuerpo = {
      id_pj: registro.id_pj,
      IdItemOPocion: registro.IdItemOPocion,
      Cantidad: registro.Cantidad + 1,
      Tipo: registro.Tipo,
    };
    setFilasEquipaje((prev) =>
      prev.map((x) =>
        x.id_pj === registro.id_pj && x.IdItemOPocion === registro.IdItemOPocion && x.Tipo === registro.Tipo
          ? { ...x, Cantidad: x.Cantidad + 1 }
          : x
      )
    );
    await fetch("/api/equipaje", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
  }

  async function reducirCantidad(registro: EquipajeFila) {
    const nuevaCantidad = registro.Cantidad - 1;
    if (nuevaCantidad >= 0) {
      setFilasEquipaje((prev) =>
        prev
          .map((x) =>
            x.id_pj === registro.id_pj && x.IdItemOPocion === registro.IdItemOPocion && x.Tipo === registro.Tipo
              ? { ...x, Cantidad: x.Cantidad - 1 }
              : x
          )
          .filter(
            (x) =>
              !(
                x.id_pj === registro.id_pj &&
                x.IdItemOPocion === registro.IdItemOPocion &&
                x.Tipo === registro.Tipo &&
                x.Cantidad <= 0
              )
          )
      );

      if (nuevaCantidad > 0) {
        await fetch("/api/equipaje", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_pj: registro.id_pj,
            IdItemOPocion: registro.IdItemOPocion,
            Cantidad: nuevaCantidad,
            Tipo: registro.Tipo,
          }),
        });
      } else {
        await fetch("/api/equipaje", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_pj: registro.id_pj,
            IdItemOPocion: registro.IdItemOPocion,
            Tipo: registro.Tipo,
          }),
        });
      }
    }
  }

  /* ===== Intercambio ===== */
  function abrirModalIntercambio(registro: EquipajeFila) {
    setRegistroParaIntercambio(registro);
    setCantidadIntercambio(1);
    setDestinoIntercambio(0);
    setModalIntercambioAbierto(true);
  }

  const opcionesDestino = useMemo(() => {
    if (!registroParaIntercambio) return [];
    const origenId = registroParaIntercambio.id_pj;
    // destinos salen de la lista de PERSONAJES
    return personajes
      .filter((p) => p.id_pj !== origenId)
      .map((p) => ({ id: p.id_pj, nombre: p.nombre }));
  }, [personajes, registroParaIntercambio]);

  async function confirmarIntercambio() {
    const r = registroParaIntercambio;
    if (!r) return;
    if (destinoIntercambio === 0 || cantidadIntercambio < 1 || cantidadIntercambio > r.Cantidad) return;

    const payload: IntercambioItemDto = {
      IdPjOrigen: r.id_pj,
      IdPjDestino: destinoIntercambio,
      IdItem: r.IdItemOPocion,
      Cantidad: cantidadIntercambio,
      Tipo: r.Tipo,
    };

    await fetch("/api/equipaje", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setModalIntercambioAbierto(false);
    await cargarDatos();
  }

  /* ===== Añadir objeto ===== */
  function abrirModalAñadir(idPj: number) {
    setPersonajeParaAñadir(idPj);
    setNuevoNombre("");
    setNuevaDescripcion("");
    setNuevaCantidad(1);
    setNuevoTipo("Item");
    setModalAñadirAbierto(true);
  }
  function cerrarModalAñadir() {
    setModalAñadirAbierto(false);
  }

  async function confirmarAñadirObjeto() {
    if (!personajeParaAñadir || !nuevoNombre.trim() || nuevaCantidad < 1) return;

    const body = {
      IdPj: personajeParaAñadir,
      IdItemOpocion: 0,
      Nombre: nuevoNombre.trim(),
      InfoItem: nuevaDescripcion.trim() || null,
      Cantidad: nuevaCantidad,
      Tipo: nuevoTipo,
    };

    await fetch("/api/equipaje", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setModalAñadirAbierto(false);
    await cargarDatos();
  }

  /* ===== UI ===== */
  return (
    <section className="detail-wrap">
      <div className="panel">
        <div className="panel-head">
          <h2>Equipaje</h2>
        </div>

        <div className="table-wrap" style={{ padding: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {gruposEquipaje.map((grupo) => (
              <div key={grupo.id_pj} className="panel" style={{ margin: 0 }}>
                <div className="panel-head">
                  <h3 style={{ margin: 0 }}>{grupo.personaje}</h3>
                </div>

                <div className="table-wrap">
                  {grupo.items.length > 0 ? (
                    <table className="table-medieval">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th style={{ width: 100 }}>Cantidad</th>
                          <th style={{ width: 160 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.items.map((item) => (
                          <tr key={`${item.IdItemOPocion}-${item.Tipo}`}>
                            <td>{item.Nombre}</td>
                            <td>{item.Cantidad}</td>
                            <td>
                              <div style={{ display: "flex", gap: ".4rem", justifyContent: "flex-end" }}>
                                <button className="btn-accent" onClick={() => incrementarCantidad(item)}>
                                  +
                                </button>
                                <button className="btn-ghost" onClick={() => reducirCantidad(item)}>
                                  -
                                </button>
                                <button className="btn-ghost" title="Intercambiar" onClick={() => abrirModalIntercambio(item)}>
                                  ↔
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty" style={{ margin: "1rem" }}>
                      <p>Este personaje no tiene objetos aún.</p>
                    </div>
                  )}

                  <div style={{ textAlign: "right", padding: "0 1rem 1rem" }}>
                    <button className="btn-accent" onClick={() => abrirModalAñadir(grupo.id_pj)}>
                      Añadir objeto
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Si aún no hay personajes cargados, mostramos un placeholder */}
            {gruposEquipaje.length === 0 && (
              <div className="empty">
                <p>Cargando personajes…</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Añadir */}
      {modalAñadirAbierto && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Añadir Objeto</h3>
              <button className="btn-ghost" onClick={cerrarModalAñadir}>
                ✖
              </button>
            </div>
            <div className="modal-body">
              <label>Nombre</label>
              <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
              <label>Descripción (opcional)</label>
              <textarea value={nuevaDescripcion} onChange={(e) => setNuevaDescripcion(e.target.value)} />
              <label>Cantidad</label>
              <input
                type="number"
                min={1}
                value={nuevaCantidad}
                onChange={(e) => setNuevaCantidad(Math.max(1, Number(e.target.value || 1)))}
              />
              <label>Tipo</label>
              <select value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value as "Item" | "Pocion")}>
                <option value="Item">Item</option>
                <option value="Pocion">Poción</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={cerrarModalAñadir}>
                Cancelar
              </button>
              <button className="btn-accent" onClick={confirmarAñadirObjeto}>
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Intercambiar */}
      {modalIntercambioAbierto && registroParaIntercambio && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Intercambiar {registroParaIntercambio.Nombre}</h3>
              <button className="btn-ghost" onClick={() => setModalIntercambioAbierto(false)}>
                ✖
              </button>
            </div>
            <div className="modal-body">
              <label>Destino</label>
              <select value={destinoIntercambio} onChange={(e) => setDestinoIntercambio(Number(e.target.value))}>
                <option value={0}>-- Selecciona --</option>
                {opcionesDestino.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <label>Cantidad (máx: {registroParaIntercambio.Cantidad})</label>
              <input
                type="number"
                min={1}
                max={registroParaIntercambio.Cantidad}
                value={cantidadIntercambio}
                onChange={(e) =>
                  setCantidadIntercambio(
                    Math.min(Math.max(1, Number(e.target.value || 1)), registroParaIntercambio.Cantidad)
                  )
                }
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setModalIntercambioAbierto(false)}>
                Cancelar
              </button>
              <button
                className="btn-accent"
                onClick={confirmarIntercambio}
                disabled={
                  destinoIntercambio === 0 || cantidadIntercambio < 1 || cantidadIntercambio > registroParaIntercambio.Cantidad
                }
              >
                Intercambiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* estilos modales base (si aún no los moviste a globals.css) */}
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
          width: min(560px, 92vw);
          background: linear-gradient(180deg, #15111a, #120e16);
          border: 1px solid #2c2233;
          border-radius: 14px;
          color: var(--ink);
          box-shadow: var(--shadow);
        }
        .modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.9rem 1rem;
          border-bottom: 1px solid #2c2233;
        }
        .modal-body {
          display: grid;
          gap: 0.6rem;
          padding: 1rem;
        }
        .modal-body input,
        .modal-body textarea,
        .modal-body select {
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
