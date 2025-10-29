// src/app/api/alchemy/elementos/route.ts
import { NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql";
import type { ElementoRow } from "@/entidades/alchemy";

export async function GET() {
  const rows = await query<ElementoRow[]>(
    `SELECT id_elemento, nombre, cantidad, color FROM Elementos ORDER BY nombre ASC`
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id_elemento);
  const cantidad = Number(body.cantidad);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const res = await execute(`UPDATE Elementos SET cantidad = ? WHERE id_elemento = ?`, [cantidad, id]);
  return NextResponse.json({ affectedRows: res.affectedRows });
}
