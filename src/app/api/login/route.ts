// src/app/api/login/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth";

type LoginBody = {
  nombre: string;
  password: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as LoginBody | null;

  const nombre = body?.nombre?.trim() ?? "";
  const password = body?.password?.trim() ?? "";

  if (!nombre || !password) {
    return NextResponse.json(
      { error: "Nombre y contraseña requeridos" },
      { status: 400 }
    );
  }

  const user = await verifyCredentials(nombre, password);
  if (!user) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({
    ok: true,
    nombre: user.nombre,
    nivel: user.nivel,
  });

  // Simple: marcamos sesión válida. Más adelante puedes guardar nombre/nivel.
  res.cookies.set({
    name: "dnd_auth",
    value: "1",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
