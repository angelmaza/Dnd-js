// src/app/(sections)/barovia/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function BaroviaPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(1);           // nivel de zoom
  const [translate, setTranslate] = useState({ x: 0, y: 0 }); // desplazamiento (pan)
  const [isPanning, setIsPanning] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const MIN = 1;
  const MAX = 4;
  const STEP = 0.25;

  // limitar valores
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const resetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  // Aplicar zoom hacia el punto del cursor
  const zoomAt = useCallback((delta: number, clientX?: number, clientY?: number) => {
    const nextScale = clamp(scale + delta, MIN, MAX);
    if (nextScale === scale) return;

    // Si no hay contenedor o no hay punto de referencia, hacemos zoom centrado
    const cont = containerRef.current;
    const content = contentRef.current;
    if (!cont || !content || clientX == null || clientY == null) {
      setScale(nextScale);
      if (nextScale === 1) setTranslate({ x: 0, y: 0 });
      return;
    }

    // Coordenadas del cursor dentro del contenedor
    const rect = cont.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;

    // El truco: mantener fijo el punto bajo el cursor.
    // x' = (x + tx)*k  => ajustamos tx para compensar el cambio de escala.
    const k = nextScale / scale;
    const newTx = cx - k * (cx - translate.x);
    const newTy = cy - k * (cy - translate.y);

    setScale(nextScale);
    setTranslate({ x: newTx, y: newTy });

    // Si volvemos a 1, recentramos
    if (nextScale === 1) {
      setTranslate({ x: 0, y: 0 });
    }
  }, [scale, translate.x, translate.y]);

  // Rueda del ratón = zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -STEP : STEP; // rueda hacia arriba -> acercar
    zoomAt(delta, e.clientX, e.clientY);
  };

  // Doble click para acercar al cursor (o reset si ya está muy cerca)
  const onDoubleClick = (e: React.MouseEvent) => {
    if (scale < 2) {
      zoomAt(0.75, e.clientX, e.clientY);
    } else {
      resetView();
    }
  };

  // Arrastrar para pan cuando hay zoom
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

  // Botones +/–
  const zoomIn = () => zoomAt(STEP);
  const zoomOut = () => zoomAt(-STEP);

  // Evitar que el navegador haga scroll con la rueda sobre el contenedor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler as any);
  }, []);

  return (
    <section className="detail-wrap">
      <div className="panel" style={{ overflow: "hidden" }}>
        <div className="panel-head" style={{ justifyContent: "space-between" }}>
          <h2>Barovia</h2>
          <div style={{ display: "flex", gap: ".4rem" }}>
            <button className="btn-ghost" onClick={zoomOut}>–</button>
            <button className="btn-ghost" onClick={zoomIn}>＋</button>
            <button className="btn-accent" onClick={resetView}>Reset</button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="map-container"
          onWheel={onWheel}
          onDoubleClick={onDoubleClick}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          style={{
            // ocupa bien el área de contenido y evita scroll horizontal
            width: "100%",
            height: "min(78vh, 900px)",
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
              // para que el cursor refleje el estado
              cursor: scale > 1 ? (isPanning ? "grabbing" : "grab") : "zoom-in",
              userSelect: "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/Map_Barovia.webp"
              alt="Mapa de Barovia"
              style={{
                display: "block",
                width: "1200px", // tamaño base; ajústalo a tu imagen
                height: "auto",
                maxWidth: "100%",
                pointerEvents: "none", // el drag lo manejamos en el wrapper
                borderRadius: 12,
                border: "1px solid #2c2233",
                boxShadow: "var(--shadow)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
