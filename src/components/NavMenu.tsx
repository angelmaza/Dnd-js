// components/NavMenu.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const indice_lateral = [
  { href: "/",          label: "Home",      icon: "🏰" },  
  { href: "/alchemy",   label: "Alchemy",   icon: "⚗️" }, 
  { href: "/inventario",label: "Inventario",icon: "🎒" }, 
  { href: "/equipaje",  label: "Equipaje",  icon: "🧳" }, 
  { href: "/npcs",      label: "NPCs",      icon: "🧙‍♂️" }, 
  { href: "/barovia",   label: "Barovia",   icon: "🧛‍♂️" }, 
  { href: "/dinero",    label: "Dinero",    icon: "💰" },

];

export default function NavMenu() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      {indice_lateral
    .map((it) => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`nav-item ${active ? "active" : ""}`}
          >
            <span className="nav-icon" aria-hidden>{it.icon}</span>
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
