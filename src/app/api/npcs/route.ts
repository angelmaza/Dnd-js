// src/app/api/npcs/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import type { NpcRow } from "@/entidades/db";

/** GET: lista completa de NPCs */
export async function GET() {
  const filas = await query<NpcRow>(
    `SELECT id_npc,
            nombre,
            imagen,
            imagen_fondo,
            informacion,
            clasificacion,
            rango
       FROM "Npcs"
      ORDER BY nombre ASC`
  );

  return NextResponse.json(filas);
}

/** POST: crear NPC */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    nombre?: string;
    informacion?: string | null;
    clasificacion?: string | null;
    imagen?: string | null;
    imagen_fondo?: string | null;
    rango?: number | null;
  } | null;

  const nombre = (body?.nombre ?? "").trim();
  if (!nombre) {
    return NextResponse.json(
      { error: "El nombre es obligatorio." },
      { status: 400 }
    );
  }

  const informacion = body?.informacion?.trim() || null;
  const clasificacion = body?.clasificacion?.trim() || null;
  const imagen = body?.imagen?.trim() || null;
  const imagen_fondo = body?.imagen_fondo?.trim() || null;
  const rango = Number(body?.rango) || 0;

  const inserted = await query<{ id_npc: number }>(
    `INSERT INTO "Npcs" (nombre, informacion, clasificacion, imagen, imagen_fondo, rango)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id_npc`,
    [nombre, informacion, clasificacion, imagen, imagen_fondo, rango]
  );

  return NextResponse.json(
    { id: inserted[0].id_npc },
    { status: 201 }
  );
}

// src/app/api/npcs/route.ts  (solo el handler PUT)
export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    id_npc?: number;
    nombre?: string;
    informacion?: string | null;
    clasificacion?: string | null;
    imagen?: string | null;
    imagen_fondo?: string | null;
    rango?: number | null;
  } | null;

  const id = Number(body?.id_npc ?? 0);
  if (!id) {
    return NextResponse.json({ error: "id_npc requerido." }, { status: 400 });
  }

  try {
    const actuales = await query<NpcRow>(
      `SELECT *
         FROM "Npcs"
        WHERE id_npc = $1
        LIMIT 1`,
      [id]
    );
    if (!actuales.length) {
      return NextResponse.json({ error: "NPC no encontrado." }, { status: 404 });
    }

    const actual = actuales[0];

    const nombre = (body?.nombre ?? actual.nombre ?? "").trim();
    if (!nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    const informacion =
      body?.informacion !== undefined ? body.informacion : actual.informacion;

    const clasificacion =
      body?.clasificacion !== undefined ? body.clasificacion : actual.clasificacion;

    const imagen = body?.imagen !== undefined ? body.imagen : actual.imagen;

    const imagen_fondo =
      body?.imagen_fondo !== undefined ? body.imagen_fondo : actual.imagen_fondo;

    const rango: number | null =
      body?.rango === undefined
        ? (actual.rango ?? null)
        : body.rango === null
        ? null
        : Number.isFinite(Number(body.rango))
        ? Number(body.rango)
        : (actual.rango ?? null);

    await execute(
      `UPDATE "Npcs"
          SET nombre        = $1,
              informacion   = $2,
              clasificacion = $3,
              imagen        = $4,
              imagen_fondo  = $5,
              rango         = $6
        WHERE id_npc       = $7`,
      [nombre, informacion, clasificacion, imagen, imagen_fondo, rango, id]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error actualizando NPC:", err);
    return NextResponse.json({ error: "Error actualizando NPC" }, { status: 500 });
  }
}


/** DELETE: borrar NPC (por id_npc en el body) */
export async function DELETE(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    id_npc?: number;
  } | null;

  const id = Number(body?.id_npc ?? 0);
  if (!id) {
    return NextResponse.json(
      { error: "id_npc requerido." },
      { status: 400 }
    );
  }

  const res = await execute(
    `DELETE FROM "Npcs"
      WHERE id_npc = $1`,
    [id]
  );

  if (res.rowCount === 0) {
    return NextResponse.json(
      { error: "No encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
