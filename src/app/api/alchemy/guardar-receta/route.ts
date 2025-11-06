// src/app/api/alchemy/guardar-receta/route.ts
import { NextResponse } from "next/server";
import { execute, query } from "@/lib/mysql";
import type { RecetasViewFinal, ElementoRow } from "@/entidades/alchemy";

export async function POST(req: Request) {
  let receta: RecetasViewFinal | null = null;
  try {
    receta = (await req.json()) as RecetasViewFinal;
  } catch {
    receta = null;
  }

  if (
    !receta ||
    !receta.NombreProducto?.trim() ||
    !Array.isArray(receta.Elementos) ||
    receta.Elementos.length === 0
  ) {
    return NextResponse.json({ error: "Receta inválida" }, { status: 400 });
  }

  // 1) Crear Producto
  const rProd = await execute(
    `INSERT INTO Productos (nombre, descripcion, toxicidad) VALUES (?, ?, ?)`,
    [receta.NombreProducto.trim(), receta.Descripcion ?? null, 1]
  );
  const idProducto = rProd.insertId;

  // 2) Insertar relaciones (solo válidas)
  for (const item of receta.Elementos) {
    const nombre = (item?.NombreElemento || "").trim();
    const prop = Number(item?.ProporcionElemento || 0);
    if (!nombre || !Number.isFinite(prop) || prop <= 0) continue;

    const elem = await query<ElementoRow[]>(
      `SELECT id_elemento FROM Elementos WHERE nombre = ? LIMIT 1`,
      [nombre]
    );
    if (!elem.length) continue;

    await execute(
      `INSERT INTO Recetas_producto_elemento (id_producto, id_elemento, proporcion) VALUES (?, ?, ?)`,
      [idProducto, elem[0].id_elemento, prop]
    );
  }

  return NextResponse.json({ id_producto: idProducto }, { status: 201 });
}
