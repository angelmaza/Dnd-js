// src/app/api/alchemy/recetas/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { VAlchemyProporcionesRow } from "@/entidades/alchemy";

/**
 * Este endpoint es robusto:
 * - Intenta la vista con casing exacto y comillas.
 * - Reintenta con minúsculas sin comillas.
 * - Si no existe la vista, hace fallback a SELECT inline con JOINs.
 */
export async function GET() {

  // 1) Intento: vista con comillas y mayúsculas
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
      FROM public."V_ALCHEMY_PROPORCIONES"
      ORDER BY "NombreProducto" ASC, "ProporcionElemento" DESC
      `
    );
    const res = NextResponse.json(rows);
    res.headers.set("x-alchemy-source", 'view "V_ALCHEMY_PROPORCIONES"');
    return res;
  } catch (err: any) {
    // 42P01: undefined_table / undefined view
    console.error('VISTA "V_ALCHEMY_PROPORCIONES" (quoted) falló:', err?.message || err);
  }

  // 2) Intento: vista en minúsculas sin comillas
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
      FROM public.v_alchemy_proporciones
      ORDER BY "NombreProducto" ASC, "ProporcionElemento" DESC
      `
    );
    const res = NextResponse.json(rows);
    res.headers.set("x-alchemy-source", "view v_alchemy_proporciones");
    return res;
  } catch (err: any) {
    console.error("vista v_alchemy_proporciones (lower) falló:", err?.message || err);
  }

  // 3) Fallback: consulta inline (JOINs) — no depende de la vista
  try {
    const rows = await query<VAlchemyProporcionesRow>(
      `
      SELECT 
        p.id_producto                   AS "Id",
        p.nombre                        AS "NombreProducto",
        e.nombre                        AS "NombreElemento",
        r.proporcion                    AS "ProporcionElemento",
        p.toxicidad                     AS "Toxicidad",
        p.descripcion                   AS "Descripcion"
      FROM public."Productos" p
      JOIN public."Recetas_producto_elemento" r ON p.id_producto = r.id_producto
      JOIN public."Elementos" e                 ON r.id_elemento = e.id_elemento
      ORDER BY "NombreProducto" ASC, "ProporcionElemento" DESC
      `
    );
    const res = NextResponse.json(rows);
    res.headers.set("x-alchemy-source", "inline-join-fallback");
    return res;
  } catch (err: any) {
    console.error("Fallback inline JOIN también falló:", err);
    return NextResponse.json(
      { error: "Error obteniendo recetas de alquimia" },
      { status: 500 }
    );
  }
}
