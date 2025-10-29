// src/lib/sql-helpers.ts
import type { RowDataPacket } from "mysql2/promise";
import { query } from "@/lib/mysql";

export type Row<T> = T & RowDataPacket;
export type NumRow<K extends string> = Row<Record<K, number>>;

/** Devuelve la primera fila o null */
export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T[]>(sql, params);
  return rows[0] ?? null;
}
