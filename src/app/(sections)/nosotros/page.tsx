"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Personaje = {
  id_pj: number;
  nombre: string;
  informacion: string | null;
};

export default function Page() {
  const router = useRouter();

  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [modalPjOpen, setModalPjOpen] = useState(false);
  const [newPj, setNewPj] = useState({ nombre: "", informacion: "" });

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
  const irAPersonaje = (p: Personaje) => router.push(`/personajes/${p.id_pj}`);

  const crearPj = async () => {
    const body = {
      nombre: newPj.nombre.trim(),
      informacion: newPj.informacion.trim(),
      imagen: null,
      imagen_fondo: null,
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
        { id_pj: creado.id, nombre: body.nombre, informacion: body.informacion },
      ]);
      setModalPjOpen(false);
      setNewPj({ nombre: "", informacion: "" });
    }
  };

  return (
    <section>
      <h1>Bienvenido a Barovia</h1>
      <p>
        Entre nieblas y colmillos, tu diario de campaña cobra vida. Revisa misiones, gestiona personajes y registra nuevas hazañas.
      </p>

     

      {/* PERSONAJES */}
      {hayPersonajes && (
        <div className="panel">
          <div className="panel-head">
            <h2>Personajes</h2>
            <button className="btn-accent" onClick={() => setModalPjOpen(true)}>
              Nuevo personaje
            </button>
          </div>
          <div className="table-wrap">
            <table className="table-medieval">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Información</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {personajes.map((p) => (
                  <tr key={p.id_pj}>
                    <td>{p.nombre}</td>
                    <td className="muted">{p.informacion ?? "-"}</td>
                    <td>
                      <button className="btn-ghost" onClick={() => irAPersonaje(p)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!hayPersonajes && (
        <div className="empty">
          <p>No hay datos todavía. Crea tu primer personaje.</p>
          <div className="actions">
            <button className="btn-ghost" onClick={() => setModalPjOpen(true)}>
              Nuevo personaje
            </button>
          </div>
        </div>
      )}

    

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
              <input value={newPj.nombre} onChange={(e) => setNewPj({ ...newPj, nombre: e.target.value })} />
              <label>Información</label>
              <textarea value={newPj.informacion} onChange={(e) => setNewPj({ ...newPj, informacion: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setModalPjOpen(false)}>Cancelar</button>
              <button className="btn btn-accent" onClick={crearPj}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
