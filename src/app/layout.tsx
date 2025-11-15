// app/layout.tsx
import type { Metadata } from "next";
import "../styles/globals.css";
import NavMenu from "@/components/NavMenu";
import ResourceBar from "@/components/ResourceBar";

export const metadata: Metadata = {
  title: "DnD_Stradh",
  description: "Descripcion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="brand">DnD_js</div>
            <ResourceBar />
          </header>
          <div className="layout">
            <aside className="sidebar">
              <NavMenu />
            </aside>
            <main className="content">
              {children}
            </main>
          </div>
          {/* <footer className="footer">© {new Date().getFullYear()} DnD_js</footer> */}
        </div>
      </body>
    </html>
  );
}
