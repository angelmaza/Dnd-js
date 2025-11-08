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
    return NextResponse.json(
      { error: "Receta inválida" },
      { status: 400 }
    );
  }

  const nombreProducto = receta.NombreProducto.trim();
  const descripcion = receta.Descripcion ?? null;

  // 1) Crear Producto (Postgres: RETURNING)
  const prodRows = await query<{ id_producto: number }>(
    `INSERT INTO "Productos" (nombre, descripcion, toxicidad)
     VALUES ($1, $2, $3)
     RETURNING id_producto`,
    [nombreProducto, descripcion, 1]
  );

  if (!prodRows.length) {
    return NextResponse.json(
      { error: "No se pudo crear el producto" },
      { status: 500 }
    );
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

    if (!elemRows.length) {
      continue;
    }

    const idElemento = elemRows[0].id_elemento;

    await execute(
      `INSERT INTO "Recetas_producto_elemento" (id_producto, id_elemento, proporcion)
       VALUES ($1, $2, $3)`,
      [idProducto, idElemento, proporcion]
    );
  }

  return NextResponse.json(
    { id_producto: idProducto },
    { status: 201 }
  );
}
