// src/app/api/personajes/route.ts
import { NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql";
import type { PersonajeRow } from "@/entidades/db";

// GET /api/personajes
export async function GET() {
  const rows = await query<PersonajeRow[]>(
    `SELECT id_pj, nombre, informacion, imagen, imagen_fondo
     FROM Personajes
     ORDER BY id_pj ASC`
  );
  return NextResponse.json(rows);
}

// POST /api/personajes
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const nombre = String(body.nombre || "").trim();
  const informacion = body.informacion ?? null;
  const imagen = body.imagen ?? null;
  const imagen_fondo = body.imagen_fondo ?? null;

  if (!nombre) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const result = await execute(
    `INSERT INTO Personajes (nombre, informacion, imagen, imagen_fondo)
     VALUES (?, ?, ?, ?)`,
    [nombre, informacion, imagen, imagen_fondo]
  );

  return NextResponse.json({ id: result.insertId }, { status: 201 });
}
