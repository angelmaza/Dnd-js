// src/app/api/personajes/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import type { PersonajeRow } from "@/entidades/db";

/** Extrae el id numérico del final de la URL del request.
 *  Devuelve null si no es un número válido. */
function getIdFromRequest(req: Request): number | null {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const idStr = segments[segments.length - 1];
    const numId = Number(idStr);
    return Number.isFinite(numId) ? numId : null;
  } catch {
    return null;
  }
}

// GET /api/personajes/:id
export async function GET(req: Request) {
  const numId = getIdFromRequest(req);
  if (numId === null) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const rows = await query<PersonajeRow>(
    `SELECT id_pj, nombre, informacion, imagen, imagen_fondo
       FROM "Personajes"
      WHERE id_pj = $1
      LIMIT 1`,
    [numId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

// PUT /api/personajes/:id
export async function PUT(req: Request) {
  const numId = getIdFromRequest(req);
  if (numId === null) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as {
    nombre?: string;
    informacion?: string | null;
    imagen?: string | null;
    imagen_fondo?: string | null; // no la tocaremos si no viene
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // undefined => no modificar; null => poner a NULL; "" => se guarda vacío
  const nombre =
    typeof body.nombre === "string" ? body.nombre.trim() : undefined;
  const informacion =
    body.informacion === undefined ? undefined : body.informacion ?? null;
  const imagen =
    body.imagen === undefined ? undefined : body.imagen ?? null;
  const imagen_fondo =
    body.imagen_fondo === undefined ? undefined : body.imagen_fondo ?? null;

  try {
    const res = await execute(
      `UPDATE "Personajes"
          SET nombre        = COALESCE($1, nombre),
              informacion   = COALESCE($2, informacion),
              imagen        = COALESCE($3, imagen),
              imagen_fondo  = COALESCE($4, imagen_fondo)
        WHERE id_pj = $5`,
      [
        nombre === undefined ? null : nombre,
        informacion === undefined ? null : informacion,
        imagen === undefined ? null : imagen,
        imagen_fondo === undefined ? null : imagen_fondo,
        numId,
      ]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg =
      err instanceof Error
        ? `${err.name}: ${err.message}\n${err.stack ?? ""}`
        : String(err);

    console.error("Error actualizando personaje:", msg);
    return NextResponse.json(
      { error: "Error actualizando personaje" },
      { status: 500 }
    );
  }
}

// DELETE /api/personajes/:id
export async function DELETE(req: Request) {
  const numId = getIdFromRequest(req);
  if (numId === null) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const result = await execute(
    `DELETE FROM "Personajes" WHERE id_pj = $1`,
    [numId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ affectedRows: result.rowCount });
}
