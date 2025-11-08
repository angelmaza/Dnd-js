// src/lib/sql-helpers.ts
import { query } from "@/lib/db";
import type { QueryResultRow } from "pg";

/**
 * Fila con una única columna numérica.
 * Ej: NumRow<"cantidad">  ->  { cantidad: number }
 */
export type NumRow<K extends string> = {
  [P in K]: number;
};

/**
 * Devuelve la primera fila o null.
 * Usa la misma signatura de tipos que query<T>.
 */
export async function queryOne<T extends QueryResultRow>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
