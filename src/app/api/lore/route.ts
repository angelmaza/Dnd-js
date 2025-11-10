// src/app/api/lore/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import type { LoreRow } from "@/entidades/db";

/**
 * GET /api/lore
 * Lista de entradas de lore
 */
export async function GET() {
  const rows = await query<LoreRow>(
    `SELECT id_lore,
            titulo,
            texto
       FROM "Lore"
      ORDER BY id_lore ASC`
  );

  return NextResponse.json(rows);
}

/**
 * POST /api/lore
 * Crea una nueva entrada de lore
 * Body: { titulo: string; texto?: string | null }
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { titulo?: string; texto?: string | null }
    | null;

  const titulo = (body?.titulo ?? "").trim();
  const texto = body?.texto ?? null;

  if (!titulo) {
    return NextResponse.json(
      { error: "El título es obligatorio." },
      { status: 400 }
    );
  }

  // Usamos RETURNING para obtener el id_lore generado
  const inserted = await query<{ id_lore: number }>(
    `INSERT INTO "Lore" (titulo, texto)
     VALUES ($1, $2)
     RETURNING id_lore`,
    [titulo, texto]
  );

  const id = inserted[0]?.id_lore;

  return NextResponse.json({ id_lore: id, titulo, texto }, { status: 201 });
}

/**
 * PUT /api/lore
 * Actualiza una entrada existente
 * Body: { id_lore: number; titulo?: string | null; texto?: string | null }
 *
 * Si un campo viene undefined → se mantiene.
 * Si viene null o string → se actualiza a ese valor.
 */
export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | {
        id_lore?: number;
        titulo?: string | null;
        texto?: string | null;
      }
    | null;

  const id = Number(body?.id_lore);
  if (!id || !Number.isFinite(id)) {
    return NextResponse.json(
      { error: "id_lore inválido o ausente." },
      { status: 400 }
    );
  }

  // Preparamos valores: solo tocamos lo que venga definido
  const titulo =
    body && Object.prototype.hasOwnProperty.call(body, "titulo")
      ? (body.titulo ?? null)
      : undefined;

  const texto =
    body && Object.prototype.hasOwnProperty.call(body, "texto")
      ? (body.texto ?? null)
      : undefined;

  if (titulo === undefined && texto === undefined) {
    return NextResponse.json(
      { error: "No hay campos para actualizar." },
      { status: 400 }
    );
  }

  // Construimos el UPDATE dinámicamente para no liar el COALESCE
  const sets: string[] = [];
  const values: (string | null | number)[] = [];
  let idx = 1;

  if (titulo !== undefined) {
    sets.push(`titulo = $${idx++}`);
    values.push(titulo);
  }

  if (texto !== undefined) {
    sets.push(`texto = $${idx++}`);
    values.push(texto);
  }

  values.push(id); // último para el WHERE

  const res = await execute(
    `UPDATE "Lore"
        SET ${sets.join(", ")}
      WHERE id_lore = $${idx}`,
    values
  );

  if (res.rowCount === 0) {
    return NextResponse.json(
      { error: "Entrada de lore no encontrada." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
