// src/app/api/alchemy/mats/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/mysql";

// Cada fila: un elemento extraíble de un material
type MatsMapRow = {
  id: number;                 // id de Mats_extraidos
  id_material: number;
  material: string | null;
  cant_material: number | null;
  elemento: string | null;
  cant_extraible: number;     // cuántos “Elementos” salen por 1 “Material”
};

export async function GET() {
  const rows = await query<MatsMapRow[]>(
    `SELECT me.id,
            m.id_material,
            m.nombre       AS material,
            m.cantidad     AS cant_material,
            e.nombre       AS elemento,
            me.cant_extraible
       FROM Mats_extraidos me
       JOIN Materiales m ON me.id_material = m.id_material
       JOIN Elementos  e ON me.id_elemento = e.id_elemento
     ORDER BY m.nombre, me.id`
  );

  // Agrupar por material para que sea más fácil de consumir en el UI
  const grouped = Object.values(
    rows.reduce((acc, r) => {
      const k = r.id_material;
      if (!acc[k]) {
        acc[k] = {
          id_material: r.id_material,
          material: r.material,
          cant_material: r.cant_material ?? 0,
          elementos: [] as { nombre: string; proporcion: number }[],
        };
      }
      if (r.elemento) {
        acc[k].elementos.push({ nombre: r.elemento, proporcion: r.cant_extraible });
      }
      return acc;
    }, {} as Record<number, { id_material: number; material: string | null; cant_material: number; elementos: { nombre: string; proporcion: number }[] }>)
  );

  return NextResponse.json(grouped);
}
