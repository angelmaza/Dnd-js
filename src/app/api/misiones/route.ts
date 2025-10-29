// src/app/api/misiones/route.ts
import { NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql";
import type { MisionRow } from "@/entidades/db";

// GET /api/misiones
export async function GET() {
  const rows = await query<MisionRow[]>(
    `SELECT id_mision, titulo, zona, npc, descripcion, importancia, recompensa, completada
     FROM Misiones
     ORDER BY id_mision ASC`
  );
  return NextResponse.json(rows);
}

// POST /api/misiones
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const titulo = String(body.titulo || "").trim();
  const zona = body.zona ?? null;
  const npc = body.npc ?? null;
  const descripcion = body.descripcion ?? null;
  const importancia = Number(body.importancia ?? 1);
  const recompensa = body.recompensa ?? null;
  const completada = body.completada ? 1 : 0;

  if (!titulo) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }

  const result = await execute(
    `INSERT INTO Misiones (titulo, zona, npc, descripcion, importancia, recompensa, completada)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [titulo, zona, npc, descripcion, importancia, recompensa, completada]
  );

  return NextResponse.json({ id: result.insertId }, { status: 201 });
}
