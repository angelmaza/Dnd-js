// src/app/api/npcs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql";
import type { NpcRow } from "@/entidades/db";

/** GET: lista completa de NPCs */
export async function GET() {
  const filas = await query<NpcRow[]>(
    `SELECT id_npc, nombre, imagen, imagen_fondo, informacion, clasificacion
       FROM Npcs
     ORDER BY nombre ASC`
  );
  return NextResponse.json(filas);
}

/** POST: crear NPC */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Partial<{
    nombre: string;
    informacion: string | null;
    clasificacion: string | null;
    imagen: string | null;
    imagen_fondo: string | null;
  }>;

  const nombre = (body?.nombre ?? "").trim();
  if (!nombre) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  const informacion = (body?.informacion ?? "").trim() || null;
  const clasificacion = (body?.clasificacion ?? "").trim() || null;
  const imagen = (body?.imagen ?? "").trim() || null;
  const imagen_fondo = (body?.imagen_fondo ?? "").trim() || null;

  const res = await execute(
    `INSERT INTO Npcs (nombre, informacion, clasificacion, imagen, imagen_fondo)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, informacion, clasificacion, imagen, imagen_fondo]
  );

  return NextResponse.json({ id: res.insertId }, { status: 201 });
}

/** PUT: actualizar NPC (por id_npc en el body) */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null) as Partial<{
    id_npc: number;
    nombre: string;
    informacion: string | null;
    clasificacion: string | null;
    imagen: string | null;
    imagen_fondo: string | null;
  }>;

  const id = Number(body?.id_npc) || 0;
  if (!id) return NextResponse.json({ error: "id_npc requerido." }, { status: 400 });

  // Si el cliente no manda algún campo, lo dejamos como está (parche en SQL)
  const actual = await query<NpcRow[]>(`SELECT * FROM Npcs WHERE id_npc = ? LIMIT 1`, [id]);
  if (!actual.length) return NextResponse.json({ error: "NPC no encontrado." }, { status: 404 });

  const nombre = (body?.nombre ?? actual[0].nombre ?? "").trim();
  if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  const informacion = (body?.informacion ?? actual[0].informacion ?? "").trim() || null;
  const clasificacion = (body?.clasificacion ?? actual[0].clasificacion ?? "").trim() || null;
  const imagen = (body?.imagen ?? actual[0].imagen ?? "").trim() || null;
  const imagen_fondo = (body?.imagen_fondo ?? actual[0].imagen_fondo ?? "").trim() || null;

  await execute(
    `UPDATE Npcs
        SET nombre = ?, informacion = ?, clasificacion = ?, imagen = ?, imagen_fondo = ?
      WHERE id_npc = ?`,
    [nombre, informacion, clasificacion, imagen, imagen_fondo, id]
  );

  return NextResponse.json({ ok: true });
}

/** DELETE: borrar NPC (por id_npc en el body) */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null) as Partial<{ id_npc: number }>;
  const id = Number(body?.id_npc) || 0;
  if (!id) return NextResponse.json({ error: "id_npc requerido." }, { status: 400 });

  await execute(`DELETE FROM Npcs WHERE id_npc = ?`, [id]);
  return NextResponse.json({ ok: true });
}
