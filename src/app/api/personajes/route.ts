// src/app/api/personajes/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/mysql";
import type { PersonajeRow } from "@/entidades/db";

// GET /api/personajes/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const rows = await query<PersonajeRow[]>(
    `SELECT id_pj, nombre, informacion, imagen, imagen_fondo
     FROM Personajes
     WHERE id_pj = ?
     LIMIT 1`,
    [numId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
