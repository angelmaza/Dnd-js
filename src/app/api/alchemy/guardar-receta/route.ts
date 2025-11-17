// src/app/api/alchemy/guardar-receta/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import type { RecetasViewFinal, ElementoRow } from "@/entidades/alchemy";

export async function POST(req: Request) {
  const receta = (await req.json().catch(() => null)) as RecetasViewFinal | null;

  if (
    !receta ||
    !receta.NombreProducto?.trim() ||
    !Array.isArray(receta.Elementos) ||
    receta.Elementos.length === 0
  ) {
    return NextResponse.json({ error: "Receta inválida" }, { status: 400 });
  }

  const nombreProducto = receta.NombreProducto.trim();
  const descripcion = receta.Descripcion ?? null;

  // 1) Crear Producto
  const prodRows = await query<{ id_producto: number }>(
    `INSERT INTO "Productos" (nombre, descripcion, toxicidad)
     VALUES ($1, $2, $3)
     RETURNING id_producto`,
    [nombreProducto, descripcion, 1]
  );

  if (!prodRows.length) {
    return NextResponse.json({ error: "No se pudo crear el producto" }, { status: 500 });
  }

  const idProducto = prodRows[0].id_producto;

  // 2) Insertar relaciones válidas
  for (const item of receta.Elementos) {
    const nombreElemento = (item?.NombreElemento || "").trim();
    const proporcion = Number(item?.ProporcionElemento ?? 0);

    if (!nombreElemento || !Number.isFinite(proporcion) || proporcion <= 0) {
      continue;
    }

    const elemRows = await query<ElementoRow>(
      `SELECT id_elemento
         FROM "Elementos"
        WHERE nombre = $1
        LIMIT 1`,
      [nombreElemento]
    );

    if (!elemRows.length) continue;

    const idElemento = elemRows[0].id_elemento;

    await execute(
      `INSERT INTO "Recetas_producto_elemento" (id_producto, id_elemento, proporcion)
       VALUES ($1, $2, $3)`,
      [idProducto, idElemento, proporcion]
    );
  }

  return NextResponse.json({ id_producto: idProducto }, { status: 201 });
}

/** DELETE: eliminar receta (producto) y sus relaciones
 * Body admitido:
 *  - { "id_producto": number }
 *  - { "nombre": string }  // opcional, por si prefieres borrar por nombre
 */
export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { id_producto?: unknown; nombre?: unknown }
    | null;

  if (!body || (body.id_producto == null && body.nombre == null)) {
    return NextResponse.json(
      { error: "Debe indicar 'id_producto' o 'nombre'." },
      { status: 400 }
    );
  }

  // Resolver id a partir del body
  let idProducto: number | null = null;

  // Prioridad: id_producto si es numérico
  if (typeof body.id_producto === "number" && Number.isFinite(body.id_producto)) {
    idProducto = body.id_producto;
  } else if (typeof body.id_producto === "string" && body.id_producto.trim() !== "") {
    const parsed = Number(body.id_producto);
    if (Number.isFinite(parsed)) idProducto = parsed;
  }

  // Si no hay id válido, intentar por nombre
  if (idProducto == null && typeof body.nombre === "string" && body.nombre.trim() !== "") {
    const rows = await query<{ id_producto: number }>(
      `SELECT id_producto FROM "Productos" WHERE nombre = $1 LIMIT 1`,
      [body.nombre.trim()]
    );
    if (rows.length) idProducto = rows[0].id_producto;
  }

  if (idProducto == null) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  // Comprobar existencia
  const existe = await query<{ id_producto: number }>(
    `SELECT id_producto FROM "Productos" WHERE id_producto = $1 LIMIT 1`,
    [idProducto]
  );
  if (!existe.length) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // Borrar relaciones y luego el producto
  // (si tienes ON DELETE CASCADE, podrías omitir el primer DELETE)
  await execute(
    `DELETE FROM "Recetas_producto_elemento" WHERE id_producto = $1`,
    [idProducto]
  );

  const del = await execute(
    `DELETE FROM "Productos" WHERE id_producto = $1`,
    [idProducto]
  );

  if (del.rowCount === 0) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id_producto: idProducto });
}
