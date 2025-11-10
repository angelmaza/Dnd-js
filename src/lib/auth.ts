// src/lib/auth.ts
import { query } from "@/lib/db";

export interface LoginRow {
  nombre: string;
  password: string;
  nivel: number | null;
}

export async function getLoginByNombre(
  nombre: string
): Promise<LoginRow | null> {
  const rows = await query<LoginRow>(
    `SELECT nombre, password, nivel
       FROM "Login"
      WHERE nombre = $1
      LIMIT 1`,
    [nombre]
  );
  return rows[0] ?? null;
}

export async function verifyCredentials(
  nombre: string,
  password: string
): Promise<LoginRow | null> {
  const row = await getLoginByNombre(nombre);
  if (!row) return null;
  if (row.password !== password) return null;
  return row; // correcto
}
