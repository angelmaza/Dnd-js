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
  try {
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
    // Fondo por defecto en caso de no recibirlo
    const imagen_fondo = (body?.imagen_fondo ?? "Bosque.jpg").trim();
    const rango =
      body?.rango === null || body?.rango === undefined
        ? 0
        : Number.isFinite(Number(body.rango))
        ? Number(body.rango)
        : 0;

    const inserted = await query<{ id_npc: number }>(
      `INSERT INTO "Npcs" (nombre, informacion, clasificacion, imagen, imagen_fondo, rango)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_npc`,
      [nombre, informacion, clasificacion, imagen, imagen_fondo, rango]
    );

    return NextResponse.json({ id: inserted[0].id_npc }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/npcs error:", e?.message || e);
    return NextResponse.json({ error: "Error creando NPC" }, { status: 500 });
  }
}

/** PUT: actualizar NPC (por id_npc en el body) */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      id_npc?: number;
      nombre?: string;
      informacion?: string | null;
      clasificacion?: string | null;
      imagen?: string | null;
      imagen_fondo?: string | null; // no es obligatorio tocarlo
      rango?: number | null;
    } | null;

    const id = Number(body?.id_npc ?? 0);
    if (!id) {
      return NextResponse.json(
        { error: "id_npc requerido." },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: "El nombre es obligatorio." },
        { status: 400 }
      );
    }

    const informacion =
      body?.informacion !== undefined ? body.informacion : actual.informacion;

    const clasificacion =
      body?.clasificacion !== undefined ? body.clasificacion : actual.clasificacion;

    const imagen = body?.imagen !== undefined ? body.imagen : actual.imagen;

    // Si no envías imagen_fondo desde el form, se mantiene
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

    // Logs útiles para depurar (aparecen en terminal)
    console.log("[PUT /api/npcs] id:", id, "imagen:", imagen, "rango:", rango);

    const res = await execute(
      `UPDATE "Npcs"
          SET nombre = $1,
              informacion = $2,
              clasificacion = $3,
              imagen = $4,
              imagen_fondo = $5,
              rango = $6
        WHERE id_npc = $7`,
      [nombre, informacion, clasificacion, imagen, imagen_fondo, rango, id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "No actualizado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("PUT /api/npcs error:", e?.message || e);
    return NextResponse.json({ error: "Error actualizando NPC" }, { status: 500 });
  }
}

/** DELETE: borrar NPC (por id_npc en el body) */
export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { id_npc?: number } | null;
    const id = Number(body?.id_npc ?? 0);
    if (!id) {
      return NextResponse.json(
        { error: "id_npc requerido." },
        { status: 400 }
      );
    }

    const res = await execute(
      `DELETE FROM "Npcs" WHERE id_npc = $1`,
      [id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/npcs error:", e?.message || e);
    return NextResponse.json({ error: "Error eliminando NPC" }, { status: 500 });
  }
}
