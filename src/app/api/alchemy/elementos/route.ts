// src/app/api/alchemy/elementos/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import type { ElementoRow } from "@/entidades/alchemy";

// GET /api/alchemy/elementos
export async function GET() {
  const rows = await query<ElementoRow>(
    `SELECT id_elemento,
            nombre,
            cantidad,
            color
       FROM "Elementos"
      ORDER BY nombre ASC`
  );

  return NextResponse.json(rows);
}

// POST /api/alchemy/elementos
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    id_elemento?: number;
    cantidad?: number;
  } | null;

  if (!body) {
    return NextResponse.json(
      { error: "Payload inválido" },
      { status: 400 }
    );
  }

  const id = Number(body.id_elemento);
  const cantidad = Number(body.cantidad);

  if (!Number.isFinite(id)) {
    return NextResponse.json(
      { error: "id inválido" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(cantidad)) {
    return NextResponse.json(
      { error: "cantidad inválida" },
      { status: 400 }
    );
  }

  const res = await execute(
    `UPDATE "Elementos"
        SET cantidad = $1
      WHERE id_elemento = $2`,
    [cantidad, id]
  );

  return NextResponse.json({ affectedRows: res.rowCount });
}
