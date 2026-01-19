// src/app/api/alchemy/extraer/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";

type Body = {
  id_material: number;
  cantidad: number;
};

type ExtraMapRow = {
  id_elemento: number;
  cant_extraible: number;
};

type IncRow = {
  id_elemento: number;
  inc: number;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;

  if (
    !body ||
    !Number.isFinite(body.id_material) ||
    !Number.isFinite(body.cantidad) ||
    body.cantidad <= 0
  ) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const idMat = Number(body.id_material);
  const cant = Number(body.cantidad);

  // =========================
  // PASO 1) Leer mapeo de extracción
  // =========================
  const mapRows = await query<ExtraMapRow>(
    `SELECT me.id_elemento,
            me.cant_extraible
       FROM "Mats_extraidos" me
      WHERE me.id_material = $1`,
    [idMat]
  );

  if (mapRows.length === 0) {
    return NextResponse.json(
      { error: "Este material no tiene mapeo de extracción" },
      { status: 400 }
    );
  }

  const increments: IncRow[] = [];
  for (const row of mapRows) {
    const extraible = Number(row.cant_extraible);
    if (!Number.isFinite(extraible) || extraible <= 0) continue;

    const inc = extraible * cant;
    if (!Number.isFinite(inc) || inc <= 0) continue;

    increments.push({ id_elemento: row.id_elemento, inc });
  }

  if (increments.length === 0) {
    return NextResponse.json(
      { error: "El mapeo existe, pero no hay nada que sumar (cant_extraible<=0)." },
      { status: 400 }
    );
  }

  // =========================
  // PASO 2) Sumar en Elementos
  // =========================
  for (const it of increments) {
    await execute(
      `UPDATE "Elementos"
          SET cantidad = COALESCE(cantidad, 0) + $1
        WHERE id_elemento = $2`,
      [it.inc, it.id_elemento]
    );
  }

  return NextResponse.json({
    ok: true,
    id_material: idMat,
    cantidad: cant,
    sumado: increments, // [{ id_elemento, inc }, ...]
  });
}
