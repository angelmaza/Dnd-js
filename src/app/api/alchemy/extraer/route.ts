// src/app/api/alchemy/extraer/route.ts
import { NextResponse } from "next/server";
import { execute, query } from "@/lib/mysql";
import type { RowDataPacket } from "mysql2";

type Body = { id_material: number; cantidad: number };

// filas tipadas correctamente
type MaterialRow = RowDataPacket & { cantidad: number | null };
type ExtraMapRow = RowDataPacket & { id_elemento: number; proporcion: number };

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

  // 1) Comprobar material y stock
  const mats = await query<MaterialRow[]>(
    `SELECT cantidad FROM Materiales WHERE id_material = ? LIMIT 1`,
    [idMat]
  );

  if (!mats.length) {
    return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });
  }

  const stock = mats[0].cantidad ?? 0;
  if (stock < cant) {
    return NextResponse.json(
      { error: "Stock insuficiente de material" },
      { status: 400 }
    );
  }

  // 2) Proporciones
  const mapRows = await query<ExtraMapRow[]>(
    `SELECT me.id_elemento AS id_elemento,
            me.cant_extraible AS proporcion
       FROM Mats_extraidos me
      WHERE me.id_material = ?`,
    [idMat]
  );

  if (!mapRows.length) {
    return NextResponse.json(
      { error: "Este material no tiene mapeo de extracción" },
      { status: 400 }
    );
  }

  // 3) Restar materiales
  await execute(
    `UPDATE Materiales
        SET cantidad = cantidad - ?
      WHERE id_material = ?`,
    [cant, idMat]
  );

  // 4) Sumar elementos
  for (const row of mapRows) {
    const inc = Number(row.proporcion) * cant;
    if (inc > 0) {
      await execute(
        `UPDATE Elementos
            SET cantidad = IFNULL(cantidad,0) + ?
          WHERE id_elemento = ?`,
        [inc, row.id_elemento]
      );
    }
  }

  return NextResponse.json({ ok: true, id_material: idMat, cantidad: cant });
}
