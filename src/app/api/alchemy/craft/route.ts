// src/app/api/alchemy/craft/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import type { CraftRequest, ElementoRow } from "@/entidades/alchemy";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CraftRequest | null;

  if (
    !body ||
    !body.Receta?.NombreProducto ||
    !Array.isArray(body.Receta.Elementos)
  ) {
    return NextResponse.json(
      { error: "Payload inválido" },
      { status: 400 }
    );
  }

  const nombreProducto = body.Receta.NombreProducto.trim();
  if (!nombreProducto) {
    return NextResponse.json(
      { error: "Nombre de producto inválido" },
      { status: 400 }
    );
  }

  /* 1) Buscar producto por nombre */
  const prod = await query<{ id_producto: number }>(
    `SELECT id_producto
       FROM "Productos"
      WHERE nombre = $1
      LIMIT 1`,
    [nombreProducto]
  );

  if (prod.length === 0) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 400 }
    );
  }

  const idProducto = prod[0].id_producto;

  /* 2) Comprobar stock de cada elemento requerido */
  for (const it of body.Receta.Elementos) {
    const nombreElem = (it?.NombreElemento || "").trim();
    const prop = Number(it?.ProporcionElemento ?? 0);

    if (!nombreElem || prop <= 0) continue;

    const elemRows = await query<Pick<ElementoRow, "id_elemento" | "cantidad">>(
      `SELECT id_elemento, cantidad
         FROM "Elementos"
        WHERE nombre = $1
        LIMIT 1`,
      [nombreElem]
    );

    if (elemRows.length === 0) {
      return NextResponse.json(
        { error: `Elemento '${nombreElem}' no encontrado` },
        { status: 400 }
      );
    }

    const stock = elemRows[0].cantidad ?? 0;
    if (stock < prop) {
      return NextResponse.json(
        { error: `Stock insuficiente de '${nombreElem}'` },
        { status: 400 }
      );
    }
  }

  /* 3) Restar stock de elementos */
  for (const it of body.Receta.Elementos) {
    const nombreElem = (it?.NombreElemento || "").trim();
    const prop = Number(it?.ProporcionElemento ?? 0);

    if (!nombreElem || prop <= 0) continue;

    await execute(
      `UPDATE "Elementos"
          SET cantidad = cantidad - $1
        WHERE nombre = $2`,
      [prop, nombreElem]
    );
  }

  /* 4) Añadir a Pocion_Y_Portador para el crafter */
  const existing = await query<{ cantidad: number }>(
    `SELECT cantidad
       FROM "Pocion_Y_Portador"
      WHERE id_personaje = $1
        AND id_item = $2
      LIMIT 1`,
    [body.IdCrafter, idProducto]
  );

  if (existing.length > 0) {
    // ya tiene esta poción -> sumar 1
    await execute(
      `UPDATE "Pocion_Y_Portador"
          SET cantidad = cantidad + 1
        WHERE id_personaje = $1
          AND id_item = $2`,
      [body.IdCrafter, idProducto]
    );
  } else {
    // no la tiene -> crear registro
    await execute(
      `INSERT INTO "Pocion_Y_Portador" (id_personaje, id_item, cantidad)
       VALUES ($1, $2, 1)`,
      [body.IdCrafter, idProducto]
    );
  }

  return NextResponse.json({ ok: true });
}
