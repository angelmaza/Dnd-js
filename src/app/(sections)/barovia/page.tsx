// src/app/(sections)/barovia/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type MapDef = {
  key: string;
  title: string;
  src: string;
  baseWidth: number; // ancho base sobre el que se aplica el zoom
};

const MAPS: MapDef[] = [
  { key: "barovia", title: "Barovia", src: "/images/Map_Barovia.webp", baseWidth: 1200 },
  { key: "vallaki", title: "Vallaki", src: "/images/vallaki.webp", baseWidth: 1200 },
];

export default function BaroviaPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [activeKey, setActiveKey] = useState<string>(MAPS[0].key);
  const activeMap = MAPS.find(m => m.key === activeKey) ?? MAPS[0];

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const MIN = 1;
  const MAX = 4;
  const STEP = 0.25;

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Cuando cambias de mapa, resetea vista
  useEffect(() => {
    resetView();
  }, [activeKey, resetView]);

  // Zoom hacia el cursor
  const zoomAt = useCallback(
    (delta: number, clientX?: number, clientY?: number) => {
      const nextScale = clamp(scale + delta, MIN, MAX);
      if (nextScale === scale) return;

      const cont = containerRef.current;
      const content = contentRef.current;
      if (!cont || !content || clientX == null || clientY == null) {
        setScale(nextScale);
        if (nextScale === 1) setTranslate({ x: 0, y: 0 });
        return;
      }

      const rect = cont.getBoundingClientRect();
      const cx = clientX - rect.left;
      const cy = clientY - rect.top;

      const k = nextScale / scale;
      const newTx = cx - k * (cx - translate.x);
      const newTy = cy - k * (cy - translate.y);

      setScale(nextScale);
      setTranslate({ x: newTx, y: newTy });

      if (nextScale === 1) setTranslate({ x: 0, y: 0 });
    },
    [scale, translate.x, translate.y]
  );

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -STEP : STEP;
    zoomAt(delta, e.clientX, e.clientY);
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (scale < 2) zoomAt(0.75, e.clientX, e.clientY);
    else resetView();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return;
    setIsPanning(true);
    lastPoint.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !lastPoint.current) return;
    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
  };
  const endPan = () => {
    setIsPanning(false);
    lastPoint.current = null;
  };

  const zoomIn = () => zoomAt(STEP);
  const zoomOut = () => zoomAt(-STEP);

  // Evita scroll de la página al hacer wheel sobre el contenedor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  return (
    <section className="detail-wrap">
      {/* Selector de mapas (rectángulos/píldoras) */}
      <div className="panel">
        <div className="panel-head" style={{ justifyContent: "space-between" }}>
          <h2>Mapas de Barovia</h2>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            {MAPS.map((m) => {
              const active = m.key === activeKey;
              return (
                <button
                  key={m.key}
                  className={active ? "btn-accent" : "btn-ghost"}
                  onClick={() => setActiveKey(m.key)}
                  style={{ minWidth: 110 }}
                >
                  {m.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controles de zoom/pan */}


        {/* Visor de mapa único */}
        <div
          ref={containerRef}
          onWheel={onWheel}
          onDoubleClick={onDoubleClick}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
            background: "#0b090e",
          }}
        >
          <div
            ref={contentRef}
            style={{
              transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale})`,
              transformOrigin: "0 0",
              willChange: "transform",
              cursor: scale > 1 ? (isPanning ? "grabbing" : "grab") : "zoom-in",
              userSelect: "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeMap.src}
              alt={`Mapa de ${activeMap.title}`}
              style={{
                display: "block",
                width: `${activeMap.baseWidth}px`,
                height: "auto",
                maxWidth: "100%",
                pointerEvents: "none",
                borderRadius: 12,
                border: "1px solid #2c2233",
                boxShadow: "var(--shadow)",
              }}
            />
          </div>
        </div>

        <div className="table-wrap" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", gap: ".4rem", justifyContent: "center" }}>
            <button className="btn-ghost" onClick={zoomOut}>–</button>
            <button className="btn-ghost" onClick={zoomIn}>＋</button>
            <button className="btn-accent" onClick={resetView}>Reset</button>
          </div>
        </div>
      </div>
    </section>
  );
}
