// src/app/api/misiones/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql";
import type { MisionRow } from "@/entidades/db";

// Helper para extraer el ID desde la URL
function getIdFromRequest(req: Request): number | null {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];

  if (!last) return null;

  const id = Number(last);
  if (Number.isNaN(id)) return null;

  return id;
}

// GET /api/misiones/[id]
export async function GET(req: Request) {
  const id = getIdFromRequest(req);
  if (id === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const rows = await query<MisionRow[]>(
    `SELECT id_mision, titulo, zona, npc, descripcion, importancia, recompensa, completada
     FROM Misiones WHERE id_mision = ? LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

// PUT /api/misiones/[id]
export async function PUT(req: Request) {
  const id = getIdFromRequest(req);
  if (id === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({} as any));

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
        id,
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
export async function DELETE(req: Request) {
  const id = getIdFromRequest(req);
  if (id === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    await execute(`DELETE FROM Misiones WHERE id_mision = ?`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando misión:", err);
    return NextResponse.json(
      { error: "Error eliminando misión" },
      { status: 500 }
    );
  }
}
