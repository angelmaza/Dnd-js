"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Personaje = {
  id_pj: number;
  nombre: string;
  informacion: string | null;
  imagen: string | null;
  imagen_fondo: string | null;
};

export default function VerPersonaje() {
  const { id } = useParams<{ id: string }>();
  const [pj, setPj] = useState<Personaje | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const r = await fetch(`/api/personajes/${id}`, { cache: "no-store" });
      if (r.ok) setPj(await r.json());
    })();
  }, [id]);

  if (!pj) {
    return (
      <section className="detail-wrap">
        <div className="panel"><div className="panel-head"><h2>Cargando…</h2></div></div>
      </section>
    );
  }

  return (
    <section className="detail-wrap">
      <article className="media-card">
        <div>
          {pj.imagen ? (
            <img className="media-img" src={`/Nosotros/${pj.imagen}`} alt={pj.nombre} />
          ) : (
            <div className="media-img" />
          )}
        </div>

        <div className="media-body">
          <header>
            <h1 className="media-title">{pj.nombre}</h1>
            <p className="media-sub">Ficha del personaje</p>
            <div className="badges">
              <span className="badge">ID: {pj.id_pj}</span>
              {pj.imagen && <span className="badge">📷 Imagen</span>}
              {pj.imagen_fondo && <span className="badge">🖼 Fondo</span>}
            </div>
          </header>

          <div>
            <div className="sep" />
            <p className="media-text">
              {pj.informacion?.trim() || "—"}
            </p>
          </div>

          <footer className="media-actions">
            <a className="link-accent" href="/personajes">← Volver a personajes</a>
          </footer>
        </div>
      </article>

      <article className="panel" style={{ marginTop: "1rem" }}>
        <div className="panel-head"><h2>Metadatos</h2></div>
        <div className="table-wrap" style={{ padding: "1rem" }}>
          <dl className="kv">
            <dt>Imagen</dt><dd>{pj.imagen ?? <span className="muted">—</span>}</dd>
            <dt>Fondo</dt><dd>{pj.imagen_fondo ?? <span className="muted">—</span>}</dd>
          </dl>
        </div>
      </article>
    </section>
  );
}
