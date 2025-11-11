// src/app/api/alchemy/recetas/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { VAlchemyProporcionesRow } from "@/entidades/alchemy";

export async function GET() {
  try {
    const rows = await query<VAlchemyProporcionesRow>(
      `
      SELECT
        "Id",
        "NombreProducto",
        "NombreElemento",
        "ProporcionElemento",
        "Toxicidad",
        "Descripcion"
      FROM "V_ALCHEMY_PROPORCIONES"
      ORDER BY "NombreProducto" ASC, "ProporcionElemento" DESC
      `
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Error /api/alchemy/recetas:", err);
    return NextResponse.json(
      { error: "Error obteniendo recetas de alquimia" },
      { status: 500 }
    );
  }
}