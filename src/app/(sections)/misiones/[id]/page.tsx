"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

export default function VerMision() {
  const { id } = useParams<{ id: string }>();
  const [mision, setMision] = useState<Mision | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const r = await fetch(`/api/misiones/${id}`, { cache: "no-store" });
      if (r.ok) setMision(await r.json());
    })();
  }, [id]);

  if (!mision) {
    return (
      <section>
        <div className="panel">
          <div className="panel-head">
            <h2>Cargando misión…</h2>
          </div>
        </div>
      </section>
    );
  }

return (
  <section className="detail">
    <article className="detail-card">
      <header className="detail-header">
        <h1 className="detail-title">{mision.titulo}</h1>
        <div className="detail-actions">
          <span className="pill">
            {(mision.completada === 1) ? "✔ Completada" : "⏳ En curso"}
          </span>
        </div>
      </header>

      <div className="detail-body">
        <div className="detail-main">
          <section className="detail-section">
            <h4>Descripción</h4>
            <p className="detail-text">{mision.descripcion ?? <span className="detail-muted">—</span>}</p>
          </section>

          <div className="divider" />
          <dl className="meta">
            <dt>Zona</dt><dd>{mision.zona ?? <span className="detail-muted">—</span>}</dd>
            <dt>NPC</dt><dd>{mision.npc ?? <span className="detail-muted">—</span>}</dd>
            <dt>Importancia</dt><dd>{mision.importancia ?? <span className="detail-muted">—</span>}</dd>
            <dt>Recompensa</dt><dd>{mision.recompensa ?? <span className="detail-muted">—</span>}</dd>
          </dl>
        </div>

        <aside className="detail-aside">
          {/* si algún día pones imagen/arte de misión */}
          <div className="detail-muted">Sin imagen</div>
        </aside>
      </div>
    </article>
  </section>
);

}
