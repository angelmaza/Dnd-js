// src/app/api/dinero/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql";
import type { DineroRow } from "@/entidades/db";

/** GET /api/dinero — lista todas las monedas */
export async function GET() {
  const rows = await query<DineroRow[]>(
    `SELECT id_moneda, nombre, cantidad
       FROM Dinero
     ORDER BY id_moneda ASC`
  );
  return NextResponse.json(rows);
}

/** PUT /api/dinero — actualiza cantidades en bloque */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null) as Array<{
    id_moneda: number;
    cantidad: number | null;
  }> | null;

  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  // Validación rápida y updates 1 a 1 (sencillo y claro)
  for (const m of body) {
    if (!m || typeof m.id_moneda !== "number") {
      return NextResponse.json({ error: "Elemento inválido en la lista" }, { status: 400 });
    }
    const cantidad = m.cantidad ?? 0;
    await execute(
      `UPDATE Dinero SET cantidad = ? WHERE id_moneda = ?`,
      [cantidad, m.id_moneda]
    );
  }

  return NextResponse.json({ ok: true });
}
