// src/app/api/misiones/reordenar/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";

/**
 * PUT /api/misiones/reordenar
 * Actualiza masivamente el campo importancia
 */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray(body.misiones)
  ) {
    return NextResponse.json(
      { error: "Cuerpo inválido" },
      { status: 400 }
    );
  }

  const misiones = body.misiones;

  if (misiones.length === 0) {
    return NextResponse.json(
      { error: "No hay misiones para actualizar" },
      { status: 400 }
    );
  }

  try {
    // Iniciamos transacción
    await execute(`BEGIN`);

    for (const m of misiones) {
      const id = Number(m.id_mision);
      const importancia =
        m.importancia === null ||
        m.importancia === undefined
          ? null
          : Number(m.importancia);

      if (!id || Number.isNaN(id)) {
        throw new Error("ID inválido en reordenar");
      }

      await execute(
        `UPDATE "Misiones"
            SET importancia = $1
          WHERE id_mision   = $2`,
        [importancia, id]
      );
    }

    await execute(`COMMIT`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error reordenando misiones:", err);

    // Si algo falla, revertimos todo
    await execute(`ROLLBACK`).catch(() => {});

    return NextResponse.json(
      { error: "Error actualizando orden" },
      { status: 500 }
    );
  }
}
