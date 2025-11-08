// src/app/api/equipaje/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { queryOne, type NumRow } from "@/lib/sql-helpers";
import type { VEquipajePersonajesRow } from "@/entidades/db";

/* ========== GET: listar equipaje (vista) ========== */
export async function GET() {
  const filas = await query<VEquipajePersonajesRow>(
    `SELECT id_pj,
            "IdItemOPocion",
            "Personaje",
            "Nombre",
            "info_item",
            "Toxicidad",
            "Cantidad",
            "Tipo"
       FROM "V_Equipaje_Personajes"
      ORDER BY "Personaje", "Nombre"`
  );

  return NextResponse.json(filas);
}

/* ========== POST: añadir objeto (Item o Poción) ========== */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    IdPj: number;
    IdItemOpocion: number; // 0 si quieres crear nuevo item de Inventario
    Nombre: string;
    InfoItem?: string | null;
    Cantidad: number;
    Tipo: "Item" | "Pocion";
  } | null;

  if (!body) {
    return NextResponse.json(
      { error: "Se ha enviado mal el POST" },
      { status: 400 }
    );
  }

  const idPj = Number(body.IdPj) || 0;
  const tipo = body.Tipo;
  const nombre = (body.Nombre ?? "").trim();
  let idItem = Number(body.IdItemOpocion) || 0;
  const infoItem = (body.InfoItem ?? "").trim() || null;

  if (
    !idPj ||
    !nombre ||
    body.Cantidad < 1 ||
    (tipo !== "Item" && tipo !== "Pocion")
  ) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Si es ITEM nuevo (IdItemOpocion = 0), creamos en Inventario
  if (tipo === "Item" && idItem === 0) {
    const insertedItem = await query<{ id_item: number }>(
      `INSERT INTO "Inventario" (nombre, info_item)
       VALUES ($1, $2)
       RETURNING id_item`,
      [nombre, infoItem]
    );
    idItem = insertedItem[0]?.id_item ?? 0;
    if (!idItem) {
      return NextResponse.json(
        { error: "No se pudo crear el item" },
        { status: 500 }
      );
    }
  }

  // Si es POCIÓN y no hay id de producto → error
  if (tipo === "Pocion" && idItem === 0) {
    return NextResponse.json(
      {
        error:
          "Debes indicar IdItemOpocion de un producto existente para 'Pocion'.",
      },
      { status: 400 }
    );
  }

  const tabla =
    tipo === "Item" ? "Inventario_Y_Portador" : "Pocion_Y_Portador";

  // Intentar sumar si ya existe
  const upd = await execute(
    `UPDATE "${tabla}"
        SET cantidad = cantidad + $1
      WHERE id_personaje = $2 AND id_item = $3`,
    [body.Cantidad, idPj, idItem]
  );

  // Si no existía, insertar
  if (upd.rowCount === 0) {
    await execute(
      `INSERT INTO "${tabla}" (id_item, id_personaje, cantidad)
       VALUES ($1, $2, $3)`,
      [idItem, idPj, body.Cantidad]
    );
  }

  return NextResponse.json({ ok: true, id_item: idItem });
}

/* ========== PUT: actualizar cantidad (Item o Poción) ========== */
export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    id_pj: number;
    IdItemOPocion: number;
    Cantidad: number;
    Tipo: "Item" | "Pocion";
  } | null;

  if (!body) {
    return NextResponse.json(
      { error: "Payload inválido" },
      { status: 400 }
    );
  }

  const { id_pj, IdItemOPocion, Cantidad, Tipo } = body;

  if (
    !id_pj ||
    !IdItemOPocion ||
    Cantidad == null ||
    (Tipo !== "Item" && Tipo !== "Pocion")
  ) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const tabla =
    Tipo === "Item" ? "Inventario_Y_Portador" : "Pocion_Y_Portador";

  await execute(
    `UPDATE "${tabla}"
        SET cantidad = $1
      WHERE id_personaje = $2 AND id_item = $3`,
    [Cantidad, id_pj, IdItemOPocion]
  );

  return NextResponse.json({ ok: true });
}

/* ========== DELETE: eliminar registro ========== */
export async function DELETE(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    id_pj: number;
    IdItemOPocion: number;
    Tipo: "Item" | "Pocion";
  } | null;

  if (!body) {
    return NextResponse.json(
      { error: "Payload inválido" },
      { status: 400 }
    );
  }

  const { id_pj, IdItemOPocion, Tipo } = body;

  if (
    !id_pj ||
    !IdItemOPocion ||
    (Tipo !== "Item" && Tipo !== "Pocion")
  ) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const tabla =
    Tipo === "Item" ? "Inventario_Y_Portador" : "Pocion_Y_Portador";

  await execute(
    `DELETE FROM "${tabla}"
      WHERE id_personaje = $1 AND id_item = $2`,
    [id_pj, IdItemOPocion]
  );

  return NextResponse.json({ ok: true });
}

/* ========== PATCH: intercambiar entre personajes ========== */
export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    IdPjOrigen: number;
    IdPjDestino: number;
    IdItem: number;
    Cantidad: number;
    Tipo: "Item" | "Pocion";
  } | null;

  if (!body) {
    return NextResponse.json(
      { error: "Payload inválido" },
      { status: 400 }
    );
  }

  const { IdPjOrigen, IdPjDestino, IdItem, Cantidad, Tipo } = body;

  if (
    !IdPjOrigen ||
    !IdPjDestino ||
    !IdItem ||
    Cantidad < 1 ||
    (Tipo !== "Item" && Tipo !== "Pocion")
  ) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const tabla =
    Tipo === "Item" ? "Inventario_Y_Portador" : "Pocion_Y_Portador";

  type CantidadRow = NumRow<"cantidad">;

  // 1) stock origen
  const row = await queryOne<CantidadRow>(
    `SELECT cantidad
       FROM "${tabla}"
      WHERE id_personaje = $1 AND id_item = $2
      LIMIT 1`,
    [IdPjOrigen, IdItem]
  );

  if (!row || row.cantidad < Cantidad) {
    return NextResponse.json(
      { error: "No hay suficiente cantidad para intercambiar." },
      { status: 400 }
    );
  }

  // 2) restar origen
  await execute(
    `UPDATE "${tabla}"
        SET cantidad = cantidad - $1
      WHERE id_personaje = $2 AND id_item = $3`,
    [Cantidad, IdPjOrigen, IdItem]
  );

  // 3) sumar destino (update-or-insert)
  const resUpdate = await execute(
    `UPDATE "${tabla}"
        SET cantidad = cantidad + $1
      WHERE id_personaje = $2 AND id_item = $3`,
    [Cantidad, IdPjDestino, IdItem]
  );

  if (resUpdate.rowCount === 0) {
    await execute(
      `INSERT INTO "${tabla}" (id_personaje, id_item, cantidad)
       VALUES ($1, $2, $3)`,
      [IdPjDestino, IdItem, Cantidad]
    );
  }

  // 4) limpiar origen si cantidad <= 0
  await execute(
    `DELETE FROM "${tabla}"
      WHERE id_personaje = $1 AND id_item = $2 AND cantidad <= 0`,
    [IdPjOrigen, IdItem]
  );

  return NextResponse.json({ ok: true });
}
