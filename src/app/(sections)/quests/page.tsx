// src/app/(sections)/quests.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Mision = {
  id_mision: number;
  titulo: string;
  zona: string | null;
  npc: string | null;
  completada: 0 | 1 | boolean;
};



export default function Page() {
  const router = useRouter();

  const [misiones, setMisiones] = useState<Mision[]>([]);
  const [modalMisionOpen, setModalMisionOpen] = useState(false);
  const [modalPjOpen, setModalPjOpen] = useState(false);
  const [newMision, setNewMision] = useState({
    titulo: "",
    zona: "",
    npc: "",
    descripcion: "",
  });

  // Carga inicial (cliente) → consume los endpoints
  useEffect(() => {
    (async () => {
      try {
        const r1 = await fetch("/api/misiones", { cache: "no-store" });
        if (r1.ok) setMisiones(await r1.json());
      } catch {}
    })();
  }, []);

  const hayMisiones = misiones.length > 0;

  const irAMision = (m: Mision) => router.push(`/misiones/${m.id_mision}`);

  // POST: crear misión
  const crearMision = async () => {
    const body = {
      titulo: newMision.titulo.trim(),
      zona: newMision.zona.trim(),
      npc: newMision.npc.trim(),
      descripcion: newMision.descripcion.trim(),
      importancia: 1,
      recompensa: "",
      completada: 0,
    };
    if (!body.titulo) return;

    const res = await fetch("/api/misiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const creada = await res.json();
      setMisiones((prev) => [
        ...prev,
        {
          id_mision: creada.id,
          titulo: body.titulo,
          zona: body.zona,
          npc: body.npc,
          completada: 0,
        },
      ]);
      setModalMisionOpen(false);
      setNewMision({ titulo: "", zona: "", npc: "", descripcion: "" });
    }
  };


  return (
    <section>
      <h1>Bienvenido a Barovia</h1>
      <p>
        Entre nieblas y colmillos, tu diario de campaña cobra vida. Revisa misiones, gestiona personajes y registra nuevas hazañas.
      </p>

      {/* MISIONES */}
      {hayMisiones && (
        <div className="panel">
          <div className="panel-head">
            <h2>Misiones</h2>
            <button className="btn-accent" onClick={() => setModalMisionOpen(true)}>
              Nueva misión
            </button>
          </div>
          <div className="table-wrap">
            <table className="table-medieval">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Zona</th>
                  <th>Npc</th>
                  <th>Completada</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {misiones.map((m) => (
                  <tr key={m.id_mision}>
                    <td>{m.titulo}</td>
                    <td>{m.zona ?? "-"}</td>
                    <td>{m.npc ?? "-"}</td>
                    <td>{(m.completada ? 1 : 0) === 1 ? "Sí" : "No"}</td>
                    <td>
                      <button className="btn-ghost" onClick={() => irAMision(m)}>
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
      {!hayMisiones  && (
        <div className="empty">
          <p>No hay datos todavía. Crea tu primera misión o personaje.</p>
          <div className="actions">
            <button className="btn-accent" onClick={() => setModalMisionOpen(true)}>
              Nueva misión
            </button>
            <button className="btn-ghost" onClick={() => setModalPjOpen(true)}>
              Nuevo personaje
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Misión */}
      {modalMisionOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Nueva misión</h3>
              <button className="btn" onClick={() => setModalMisionOpen(false)}>
                ✖
              </button>
            </div>
            <div className="modal-body">
              <label>Título</label>
              <input value={newMision.titulo} onChange={(e) => setNewMision({ ...newMision, titulo: e.target.value })} />
              <label>Zona</label>
              <input value={newMision.zona} onChange={(e) => setNewMision({ ...newMision, zona: e.target.value })} />
              <label>NPC</label>
              <input value={newMision.npc} onChange={(e) => setNewMision({ ...newMision, npc: e.target.value })} />
              <label>Descripción</label>
              <textarea value={newMision.descripcion} onChange={(e) => setNewMision({ ...newMision, descripcion: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setModalMisionOpen(false)}>Cancelar</button>
              <button className="btn btn-accent" onClick={crearMision}>Crear</button>
            </div>
          </div>
        </div>
      )}


    </section>
  );
}
