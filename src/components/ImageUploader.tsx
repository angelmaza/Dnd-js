
//src/components/ImageUploader.tsx
"use client";

import { useRef, useState } from "react";

type Props = {
  label?: string;
  onUploaded: (url: string) => void;  // te devuelve la URL pública del Blob
  accept?: string;                    // ej: "image/*"
  maxSizeMB?: number;                 // ej: 5
  className?: string;                 // estilos opcionales
};

export default function ImageUploader({
  label = "Subir imagen",
  onUploaded,
  accept = "image/*",
  maxSizeMB = 5,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    setError(null);
    if (!files || !files[0]) return;
    const file = files[0];

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Máx ${maxSizeMB}MB`);
      return;
    }

    // preview local
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log("[Uploader] URL subida:", data.url);
        throw new Error(data.error || "Error subiendo imagen");
      }

      const data = await res.json();
      onUploaded(data.url); // URL pública del blob
      console.log("[Uploader] URL subida:", data.url);
    } catch (e: any) {
        
      setError(e.message || "Error subiendo imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className} style={{ display: "grid", gap: ".5rem" }}>
      {label && <label style={{ fontWeight: 600 }}>{label}</label>}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: "1px dashed #4b5563",
          borderRadius: 10,
          padding: "1rem",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(255,255,255,0.05)" : "transparent",
        }}
        aria-busy={uploading}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            style={{ maxHeight: 160, maxWidth: "100%", objectFit: "cover", borderRadius: 8 }}
          />
        ) : (
          <div style={{ opacity: 0.85 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📷</div>
            <div>Arrastra una imagen o haz clic para seleccionar</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              Tipos: PNG, JPG, WEBP · Máx {maxSizeMB}MB
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploading && <div className="muted">Subiendo...</div>}
      {error && <div style={{ color: "#ef4444" }}>{error}</div>}
    </div>
  );
}
