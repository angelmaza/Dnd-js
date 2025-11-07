// src/app/api/personajes/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql";
import type { PersonajeRow } from "@/entidades/db";

// GET /api/personajes/:id  -> detalle personaje
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const rows = await query<PersonajeRow[]>(
    `SELECT id_pj, nombre, informacion, imagen, imagen_fondo
     FROM Personajes
     WHERE id_pj = ? LIMIT 1`,
    [numId]
  );

  if (!rows.length) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

// PUT /api/personajes/:id  -> actualización parcial (COALESCE en SQL)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  const nombre =
    typeof body.nombre === "string" ? body.nombre.trim() : undefined;
  const informacion =
    body.informacion === undefined ? undefined : body.informacion ?? null;
  const imagen =
    body.imagen === undefined ? undefined : body.imagen ?? null;
  const imagen_fondo =
    body.imagen_fondo === undefined ? undefined : body.imagen_fondo ?? null;

  try {
    await execute(
      `UPDATE Personajes
       SET nombre        = COALESCE(?, nombre),
           informacion   = COALESCE(?, informacion),
           imagen        = COALESCE(?, imagen),
           imagen_fondo  = COALESCE(?, imagen_fondo)
       WHERE id_pj = ?`,
      [
        nombre === undefined ? null : nombre,
        informacion === undefined ? null : informacion,
        imagen === undefined ? null : imagen,
        imagen_fondo === undefined ? null : imagen_fondo,
        numId,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error actualizando personaje:", err);
    return NextResponse.json(
      { error: "Error actualizando personaje" },
      { status: 500 }
    );
  }
}

// DELETE /api/personajes/:id
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const result = await execute(
    `DELETE FROM Personajes WHERE id_pj = ?`,
    [numId]
  );

  if (!result.affectedRows) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ affectedRows: result.affectedRows });
}
