// src/app/api/upload/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    // Debe venir como multipart/form-data y el campo se llama "file"
    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Campo 'file' requerido" }, { status: 400 });
    }

    // Nombre único (opcional)
    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const key = `npcs/${Date.now()}-${safeName}`;

    // Sube al Blob Store (requiere BLOB_READ_WRITE_TOKEN configurado)
    const { url } = await put(key, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Upload error:", err?.message || err);
    return NextResponse.json({ error: "Error subiendo archivo" }, { status: 500 });
  }
}
