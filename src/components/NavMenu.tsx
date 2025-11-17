"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const indice_lateral = [
  { href: "/",          label: "Lore",      icon: "🏰" },
  { href: "/quests",    label: "Misiones",  icon: "📜" },
  { href: "/nosotros",  label: "Nosotros",  icon: "🤝" },
  { href: "/npcs",      label: "NPCs",      icon: "🧙‍♂️" },
  { href: "/alchemy",   label: "Alchemy",   icon: "⚗️" },
  { href: "/equipaje",  label: "Equipaje",  icon: "🧳" },
  { href: "/barovia",   label: "Barovia",   icon: "🧛‍♂️" },
  { href: "/dinero",    label: "Dinero",    icon: "💰" },
];

export default function NavMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Cierra el drawer al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = (
    <>
      {indice_lateral.map((it) => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`nav-item ${active ? "active" : ""}`}
          >
            <span className="nav-icon" aria-hidden>
              {it.icon}
            </span>
            <span>{it.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Escritorio: menú vertical normal */}
      <nav className="nav nav-desktop">{links}</nav>

      {/* Móvil/Tablet: botón hamburguesa + drawer */}
      <button
        type="button"
        className="nav-burger-btn"
        aria-controls="nav-drawer"
        aria-expanded={open}
        aria-label="Abrir menú"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-burger-icon" aria-hidden>☰</span>
        Menú
      </button>

      {/* Overlay */}
      <div
        className={`nav-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      {/* Drawer */}
      <aside
        id="nav-drawer"
        className={`nav-drawer ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navegación"
      >
        <div className="nav-drawer-head">
          <strong className="brand">Menú</strong>
          <button
            type="button"
            className="btn-ghost nav-drawer-close"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            ✖
          </button>
        </div>
        <nav className="nav nav-mobile">{links}</nav>
      </aside>
    </>
  );
}
