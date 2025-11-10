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

  try {
    const rows = await query<MisionRow>(
      `SELECT id_mision,
              titulo,
              zona,
              npc,
              descripcion,
              importancia,
              recompensa,
              completada
         FROM "Misiones"
        WHERE id_mision = $1
        LIMIT 1`,
      [numId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("Error consultando misión:", err);
    return NextResponse.json(
      { error: "Error obteniendo misión" },
      { status: 500 }
    );
  }
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

  // Normalizamos campos
  const titulo =
    typeof body.titulo === "string" ? body.titulo.trim() : null;
  const zona =
    typeof body.zona === "string" ? body.zona.trim() : null;
  const npc =
    typeof body.npc === "string" ? body.npc.trim() : null;
  const descripcion =
    typeof body.descripcion === "string"
      ? body.descripcion.trim()
      : null;
  const importancia =
    body.importancia === null || body.importancia === undefined || body.importancia === ""
      ? null
      : Number(body.importancia);
  const recompensa =
    typeof body.recompensa === "string"
      ? body.recompensa.trim()
      : null;

  // completada -> boolean | null (si no viene, no se toca)
  let completada: boolean | null = null;
  if (typeof body.completada === "boolean") {
    completada = body.completada;
  } else if (body.completada === 1) {
    completada = true;
  } else if (body.completada === 0) {
    completada = false;
  }

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
        titulo,
        zona,
        npc,
        descripcion,
        importancia,
        recompensa,
        completada,
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
      `DELETE FROM "Misiones"
        WHERE id_mision = $1`,
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
