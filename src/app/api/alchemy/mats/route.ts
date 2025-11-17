// src/app/api/alchemy/mats/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

// Cada fila: un elemento extraíble de un material
type MatsMapRow = {
  id: number;
  id_material: number;
  material: string | null;
  cant_material: number | null;
  elemento: string | null;
  cant_extraible: number;
};

type MaterialMapDTO = {
  id_material: number;
  material: string | null;
  cant_material: number;
  elementos: { nombre: string; proporcion: number }[];
};

export async function GET() {
  const rows = await query<MatsMapRow>(
    `SELECT me.id,
            m.id_material,
            m.nombre       AS material,
            m.cantidad     AS cant_material,
            e.nombre       AS elemento,
            me.cant_extraible
       FROM "Mats_extraidos" me
       JOIN "Materiales" m ON me.id_material = m.id_material
       JOIN "Elementos"  e ON me.id_elemento = e.id_elemento
      ORDER BY m.nombre, me.id`
  );

  const grouped = Object.values(
    rows.reduce(
      (acc, r) => {
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
          acc[k].elementos.push({
            nombre: r.elemento,
            proporcion: r.cant_extraible,
          });
        }

        return acc;
      },
      {} as Record<number, MaterialMapDTO>
    )
  );

  return NextResponse.json(grouped);
}

/* ====================================================================
   POST: crear/actualizar el mapeo de extracción de un material
   Body esperado:
   {
     "material": "Nombre del material",
     "elementos": [
       { "nombre": "Cinabrio", "proporcion": 1 },
       { "nombre": "Azufre",   "proporcion": 2 }
     ]
   }
==================================================================== */
type Body = {
  material: string;
  elementos: { nombre: string; proporcion: number }[];
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;

  if (
    !body ||
    typeof body.material !== "string" ||
    !body.material.trim() ||
    !Array.isArray(body.elementos) ||
    body.elementos.length === 0
  ) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const nombreMat = body.material.trim();
  const elementos = body.elementos
    .map((e) => ({
      nombre: (e?.nombre ?? "").trim(),
      proporcion: Number(e?.proporcion ?? 0),
    }))
    .filter((e) => e.nombre && Number.isFinite(e.proporcion) && e.proporcion > 0);

  if (!elementos.length) {
    return NextResponse.json(
      { error: "Debe indicar al menos un elemento extraíble válido" },
      { status: 400 }
    );
  }

  // 1) Buscar o crear el material
  const matRows = await query<{ id_material: number }>(
    `SELECT id_material
       FROM "Materiales"
      WHERE nombre = $1
      LIMIT 1`,
    [nombreMat]
  );

  let idMat: number;

  if (matRows.length) {
    idMat = matRows[0].id_material;
  } else {
    const inserted = await query<{ id_material: number }>(
      `INSERT INTO "Materiales" (nombre, cantidad)
       VALUES ($1, $2)
       RETURNING id_material`,
      [nombreMat, 0]
    );
    if (!inserted.length) {
      return NextResponse.json(
        { error: "No se pudo crear el material" },
        { status: 500 }
      );
    }
    idMat = inserted[0].id_material;
  }

  // 2) Para cada elemento, buscar id_elemento y crear/actualizar mapeo
  for (const el of elementos) {
    const elemRows = await query<{ id_elemento: number }>(
      `SELECT id_elemento
         FROM "Elementos"
        WHERE nombre = $1
        LIMIT 1`,
      [el.nombre]
    );

    if (!elemRows.length) continue;

    const idElem = elemRows[0].id_elemento;

    // Limpio el mapeo anterior para este par material-elemento
    await execute(
      `DELETE FROM "Mats_extraidos"
        WHERE id_material = $1
          AND id_elemento = $2`,
      [idMat, idElem]
    );

    // Creo el nuevo mapeo
    await execute(
      `INSERT INTO "Mats_extraidos" (id_material, id_elemento, cant_extraible)
       VALUES ($1, $2, $3)`,
      [idMat, idElem, el.proporcion]
    );
  }

  // 3) Devolver el mapeo completo actualizado (igual formato que GET)
  const rows = await query<MatsMapRow>(
    `SELECT me.id,
            m.id_material,
            m.nombre       AS material,
            m.cantidad     AS cant_material,
            e.nombre       AS elemento,
            me.cant_extraible
       FROM "Mats_extraidos" me
       JOIN "Materiales" m ON me.id_material = m.id_material
       JOIN "Elementos"  e ON me.id_elemento = e.id_elemento
      WHERE m.id_material = $1
      ORDER BY me.id`,
    [idMat]
  );

  const mat: MaterialMapDTO = {
    id_material: idMat,
    material: rows[0]?.material ?? nombreMat,
    cant_material: rows[0]?.cant_material ?? 0,
    elementos: rows.map((r) => ({
      nombre: r.elemento ?? "",
      proporcion: r.cant_extraible,
    })),
  };

  return NextResponse.json(mat, { status: 201 });
}
