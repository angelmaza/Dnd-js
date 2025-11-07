// src/app/api/misiones/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql";
import type { MisionRow } from "@/entidades/db";

// Helper de tipo para esta ruta
type MisionesRouteContext = RouteContext<"/api/misiones/[id]">;

// GET /api/misiones/[id]
export async function GET(
  _req: NextRequest,
  ctx: MisionesRouteContext
) {
  const { id } = await ctx.params; // params es una Promise en Next 15
  const numId = Number(id);

  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const rows = await query<MisionRow[]>(
    `SELECT id_mision, titulo, zona, npc, descripcion, importancia, recompensa, completada
     FROM Misiones WHERE id_mision = ? LIMIT 1`,
    [numId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

// PUT /api/misiones/[id]
export async function PUT(
  req: NextRequest,
  ctx: MisionesRouteContext
) {
  const { id } = await ctx.params;
  const numId = Number(id);

  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json();
  const fields = {
    titulo: body.titulo ?? null,
    zona: body.zona ?? null,
    npc: body.npc ?? null,
    descripcion: body.descripcion ?? null,
    importancia: body.importancia ?? null,
    recompensa: body.recompensa ?? null,
    completada: body.completada ? 1 : 0,
  };

  try {
    await execute(
      `UPDATE Misiones
       SET
         titulo = COALESCE(?, titulo),
         zona = COALESCE(?, zona),
         npc = COALESCE(?, npc),
         descripcion = COALESCE(?, descripcion),
         importancia = COALESCE(?, importancia),
         recompensa = COALESCE(?, recompensa),
         completada = COALESCE(?, completada)
       WHERE id_mision = ?`,
      [
        fields.titulo,
        fields.zona,
        fields.npc,
        fields.descripcion,
        fields.importancia,
        fields.recompensa,
        fields.completada,
        numId,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error actualizando misión:", err);
    return NextResponse.json(
      { error: "Error actualizando misión" },
      { status: 500 }
    );
  }
}

// DELETE /api/misiones/[id]
export async function DELETE(
  _req: NextRequest,
  ctx: MisionesRouteContext
) {
  const { id } = await ctx.params;
  const numId = Number(id);

  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    await execute(
      `DELETE FROM Misiones WHERE id_mision = ?`,
      [numId]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando misión:", err);
    return NextResponse.json(
      { error: "Error eliminando misión" },
      { status: 500 }
    );
  }
}
