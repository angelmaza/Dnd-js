// src/app/api/alchemy/craft/route.ts
import { NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql";
import type { CraftRequest, ElementoRow } from "@/entidades/alchemy";
import { RowDataPacket } from "mysql2";

//type NumeroInt = { numero: number;} Esto solo valdria si SQL me devuelve campo NUMERO

type NumeroInt<T> = T & RowDataPacket;


export async function POST(req: Request) {
  let body: CraftRequest | null = null;
  try {
    body = (await req.json()) as CraftRequest;
  } catch {
    body = null;
  }

  if (
    !body?.Receta?.NombreProducto ||
    !Array.isArray(body.Receta.Elementos)
  ) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  // Buscar producto por nombre
  const prod = await query<NumeroInt<{ id_producto: number }>[]>(
    `SELECT id_producto FROM Productos WHERE nombre = ? LIMIT 1`,
    [body.Receta.NombreProducto]
  );
  if (!prod.length) return NextResponse.json({ error: "Producto no encontrado" }, { status: 400 });

  const idProducto = prod[0].id_producto;

  // Comprobar stock
  for (const it of body.Receta.Elementos) {
    const nombre = (it?.NombreElemento || "").trim();
    const prop = Number(it?.ProporcionElemento || 0);
    if (!nombre || prop <= 0) continue;

    const elem = await query<ElementoRow[]>(
      `SELECT id_elemento, cantidad FROM Elementos WHERE nombre = ? LIMIT 1`,
      [nombre]
    );
    if (!elem.length) return NextResponse.json({ error: `Elemento '${nombre}' no encontrado` }, { status: 400 });
    const cant = elem[0].cantidad ?? 0;
    if (cant < prop) return NextResponse.json({ error: `Stock insuficiente de '${nombre}'` }, { status: 400 });
  }

  // Restar stock
  for (const it of body.Receta.Elementos) {
    const nombre = (it?.NombreElemento || "").trim();
    const prop = Number(it?.ProporcionElemento || 0);
    if (!nombre || prop <= 0) continue;
    await execute(`UPDATE Elementos SET cantidad = cantidad - ? WHERE nombre = ?`, [prop, nombre]);
  }

  // Añadir a Pocion_Y_Portador
  const existing = await query<NumeroInt<{ cantidad: number }>[]>(
    `SELECT cantidad FROM Pocion_Y_Portador WHERE id_personaje = ? AND id_item = ? LIMIT 1`,
    [body.IdCrafter, idProducto]
  );

  if (existing.length) {
    await execute(
      `UPDATE Pocion_Y_Portador SET cantidad = cantidad + 1 WHERE id_personaje = ? AND id_item = ?`,
      [body.IdCrafter, idProducto]
    );
  } else {
    await execute(
      `INSERT INTO Pocion_Y_Portador (id_personaje, id_item, cantidad) VALUES (?, ?, 1)`,
      [body.IdCrafter, idProducto]
    );
  }

  return NextResponse.json({ ok: true });
}
