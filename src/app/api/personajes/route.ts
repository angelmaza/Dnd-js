// src/app/api/personajes/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { PersonajeRow } from "@/entidades/db";

// GET /api/personajes
export async function GET() {
  const rows = await query<PersonajeRow>(
    `SELECT id_pj, nombre, informacion, imagen, imagen_fondo
       FROM "Personajes"
      ORDER BY id_pj ASC`
  );

  return NextResponse.json(rows);
}

// POST /api/personajes
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    nombre?: string;
    informacion?: string | null;
    imagen?: string | null;
    imagen_fondo?: string | null;
  } | null;

  const nombre = (body?.nombre ?? "").trim();
  if (!nombre) {
    return NextResponse.json(
      { error: "El nombre es obligatorio" },
      { status: 400 }
    );
  }

  const informacion = body?.informacion ?? null;
  const imagen = body?.imagen ?? null;
  const imagen_fondo = body?.imagen_fondo ?? null;

  // En Postgres usamos RETURNING para obtener el id insertado
  const inserted = await query<{ id_pj: number }>(
    `INSERT INTO "Personajes" (nombre, informacion, imagen, imagen_fondo)
     VALUES ($1, $2, $3, $4)
     RETURNING id_pj`,
    [nombre, informacion, imagen, imagen_fondo]
  );

  return NextResponse.json(
    { id: inserted[0].id_pj },
    { status: 201 }
  );
}
