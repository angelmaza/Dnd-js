// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/login", "/favicon.ico"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const auth = req.cookies.get("dnd_auth")?.value ?? "(no cookie)";

  console.log("[middleware]", { pathname, auth });

  // Estáticos internos de Next
  if (pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // Rutas públicas
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Si no tiene cookie válida → login
  if (auth !== "1") {
    const url = new URL("/login", req.url);
    console.log("[middleware] redirect ->", url.toString());
    return NextResponse.redirect(url);
  }

  // Si tiene cookie válida → pasa
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
