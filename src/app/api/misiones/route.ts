// src/app/api/misiones/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { MisionRow } from "@/entidades/db";

// GET /api/misiones
export async function GET() {
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
      ORDER BY id_mision ASC`
  );

  return NextResponse.json(rows);
}

// POST /api/misiones
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    titulo?: string;
    zona?: string | null;
    npc?: string | null;
    descripcion?: string | null;
    importancia?: number | null;
    recompensa?: string | null;
    completada?: boolean | number;
  } | null;

  const titulo = (body?.titulo ?? "").trim();
  if (!titulo) {
    return NextResponse.json(
      { error: "El título es obligatorio" },
      { status: 400 }
    );
  }

  const zona = body?.zona ?? null;
  const npc = body?.npc ?? null;
  const descripcion = body?.descripcion ?? null;
  const importancia =
    body?.importancia !== undefined && body.importancia !== null
      ? Number(body.importancia)
      : 1;
  const recompensa = body?.recompensa ?? null;
  const completada =
    body?.completada === true || body?.completada === 1 ? 1 : 0;

  const inserted = await query<{ id_mision: number }>(
    `INSERT INTO "Misiones"
       (titulo, zona, npc, descripcion, importancia, recompensa, completada)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id_mision`,
    [titulo, zona, npc, descripcion, importancia, recompensa, completada]
  );

  return NextResponse.json(
    { id: inserted[0].id_mision },
    { status: 201 }
  );
}
