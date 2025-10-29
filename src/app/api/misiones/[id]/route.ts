// src/app/api/misiones/[id]/route.ts
import { NextResponse } from "next/server";
import { query, execute } from "@/lib/mysql";

// GET /api/misiones/:id
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const rows = await query<any>(
    `SELECT id_mision, titulo, zona, npc, descripcion, importancia, recompensa, completada
     FROM Misiones WHERE id_mision = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

// PUT /api/misiones/:id  (actualización completa/sencilla)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));
  const fields = {
    titulo: body.titulo ?? null,
    zona: body.zona ?? null,
    npc: body.npc ?? null,
    descripcion: body.descripcion ?? null,
    importancia: body.importancia ?? null,
    recompensa: body.recompensa ?? null,
    completada: body.completada ? 1 : 0,
  };

  const result: any = await execute(
    `UPDATE Misiones
     SET titulo = COALESCE(?, titulo),
         zona = ?,
         npc = ?,
         descripcion = ?,
         importancia = COALESCE(?, importancia),
         recompensa = ?,
         completada = ?
     WHERE id_mision = ?`,
    [
      fields.titulo,
      fields.zona,
      fields.npc,
      fields.descripcion,
      fields.importancia,
      fields.recompensa,
      fields.completada,
      id,
    ]
  );

  return NextResponse.json({ affectedRows: result.affectedRows });
}

// DELETE /api/misiones/:id
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const result: any = await execute(`DELETE FROM Misiones WHERE id_mision = ?`, [id]);
  return NextResponse.json({ affectedRows: result.affectedRows });
}
