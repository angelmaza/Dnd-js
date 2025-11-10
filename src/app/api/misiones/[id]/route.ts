// src/app/api/misiones/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import type { MisionRow } from "@/entidades/db";

// GET /api/misiones/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const numId = Number(params.id);

  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const rows = await query<MisionRow>(
    `SELECT id_mision, titulo, zona, npc, descripcion, importancia, recompensa, completada
       FROM "Misiones"
      WHERE id_mision = $1
      LIMIT 1`,
    [numId]
  );

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

// PUT /api/misiones/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const numId = Number(params.id);

  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Cuerpo inválido" },
      { status: 400 }
    );
  }

  const fields = {
    titulo: body.titulo ?? null,
    zona: body.zona ?? null,
    npc: body.npc ?? null,
    descripcion: body.descripcion ?? null,
    importancia:
      body.importancia === null || body.importancia === undefined
        ? null
        : Number(body.importancia),
    recompensa: body.recompensa ?? null,
    completada:
      body.completada === 1 || body.completada === true ? 1 :
      body.completada === 0 || body.completada === false ? 0 :
      null,
  };

  try {
    await execute(
      `UPDATE "Misiones"
          SET titulo      = COALESCE($1, titulo),
              zona        = COALESCE($2, zona),
              npc         = COALESCE($3, npc),
              descripcion = COALESCE($4, descripcion),
              importancia = COALESCE($5, importancia),
              recompensa  = COALESCE($6, recompensa),
              completada  = COALESCE($7, completada)
        WHERE id_mision   = $8`,
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
  { params }: { params: { id: string } }
) {
  const numId = Number(params.id);

  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    await execute(
      `DELETE FROM "Misiones" WHERE id_mision = $1`,
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
