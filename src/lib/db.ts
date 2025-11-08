// src/lib/db.ts
import { Pool, QueryResult, QueryResultRow } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida");
}

// Valores permitidos en los parámetros de las queries
type QueryValue = string | number | boolean | null;
type QueryValues = QueryValue[];

// Reutilizar el Pool en dev para evitar múltiples conexiones
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

const pgPool: Pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Neon requiere SSL
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pgPool;
}

/**
 * Helper para SELECT.
 * T es la forma de cada fila (NpcRow, MisionRow, etc).
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: QueryValues
): Promise<T[]> {
  const res: QueryResult<T> = params
    ? await pgPool.query<T>(text, params)
    : await pgPool.query<T>(text);
  return res.rows;
}

/**
 * Helper para INSERT / UPDATE / DELETE.
 * Devuelve rowCount (nº de filas afectadas).
 */
export interface ExecuteResult {
  rowCount: number;
}

export async function execute(
  text: string,
  params?: QueryValues
): Promise<ExecuteResult> {
  const res: QueryResult = params
    ? await pgPool.query(text, params)
    : await pgPool.query(text);
  return { rowCount: res.rowCount ?? 0 };
}
