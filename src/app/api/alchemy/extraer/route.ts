// src/app/api/alchemy/extraer/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";

type Body = {
  id_material: number;
  cantidad: number;
};

type MaterialRow = {
  cantidad: number | null;
};

type ExtraMapRow = {
  id_elemento: number;
  proporcion: number;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;

  if (
    !body ||
    !Number.isFinite(body.id_material) ||
    !Number.isFinite(body.cantidad) ||
    body.cantidad <= 0
  ) {
    return NextResponse.json(
      { error: "Payload inválido" },
      { status: 400 }
    );
  }

  const idMat = Number(body.id_material);
  const cant = Number(body.cantidad);

  // 1) Comprobar material y stock
  const mats = await query<MaterialRow>(
    `SELECT cantidad
       FROM "Materiales"
      WHERE id_material = $1
      LIMIT 1`,
    [idMat]
  );

  if (mats.length === 0) {
    return NextResponse.json(
      { error: "Material no encontrado" },
      { status: 404 }
    );
  }

  const stock = mats[0].cantidad ?? 0;
  if (stock < cant) {
    return NextResponse.json(
      { error: "Stock insuficiente de material" },
      { status: 400 }
    );
  }

  // 2) Proporciones
  const mapRows = await query<ExtraMapRow>(
    `SELECT me.id_elemento,
            me.cant_extraible AS proporcion
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

  // 3) Restar materiales
  await execute(
    `UPDATE "Materiales"
        SET cantidad = cantidad - $1
      WHERE id_material = $2`,
    [cant, idMat]
  );

  // 4) Sumar elementos
  for (const row of mapRows) {
    const inc = row.proporcion * cant; // ambos son number
    if (inc > 0) {
      await execute(
        `UPDATE "Elementos"
            SET cantidad = COALESCE(cantidad, 0) + $1
          WHERE id_elemento = $2`,
        [inc, row.id_elemento]
      );
    }
  }

  return NextResponse.json({
    ok: true,
    id_material: idMat,
    cantidad: cant,
  });
}
