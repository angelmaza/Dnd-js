// src/app/api/alchemy/recetas/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { VAlchemyProporcioneRow } from "@/entidades/alchemy";

export async function GET() {
  const rows = await query<VAlchemyProporcioneRow[]>(
    `SELECT Id, NombreProducto, NombreElemento, ProporcionElemento, Toxicidad, Descripcion
     FROM V_ALCHEMY_PROPORCIONES
     ORDER BY NombreProducto ASC, ProporcionElemento DESC`
  );
  return NextResponse.json(rows); 
}
