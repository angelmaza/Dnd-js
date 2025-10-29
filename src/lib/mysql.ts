// src/lib/mysql.ts
import mysql, {
  PoolOptions,
  RowDataPacket,
  ResultSetHeader,
} from "mysql2/promise";

// Evitar recrear el pool en cada hot-reload durante `npm run dev`
declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: import("mysql2/promise").Pool | undefined;
}

const config: PoolOptions = {
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // ssl: { rejectUnauthorized: true } // activa si tu proveedor gestionado lo requiere
};

export const pool = global._mysqlPool ?? mysql.createPool(config);
if (process.env.NODE_ENV !== "production") global._mysqlPool = pool;

/**
 * Helper para SELECT.
 * T es un ARRAY de filas que extienden RowDataPacket.
 * Ejemplo de uso:
 *   interface Row extends RowDataPacket { id: number; nombre: string }
 *   const rows = await query<Row[]>(`SELECT id, nombre FROM tabla`);
 */
export async function query<T extends RowDataPacket[] = RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<T> {
  const [rows] = await pool.query<T>(sql, params);
  return rows;
}

/**
 * Helper para INSERT / UPDATE / DELETE.
 * Devuelve metadatos como insertId, affectedRows, etc.
 */
export async function execute(
  sql: string,
  params?: any[]
): Promise<ResultSetHeader> {
  const [res] = await pool.execute<ResultSetHeader>(sql, params);
  return res;
}
