import type { RowDataPacket } from "mysql2/promise";

export interface ElementoRow extends RowDataPacket {
  id_elemento: number;
  nombre: string;
  cantidad: number | null;
  color?: string | null;
}

export interface VAlchemyProporcioneRow extends RowDataPacket {
  // vista V_ALCHEMY_PROPORCIONES (ajusta a tus columnas reales)
  Id: number;                     // id_producto
  NombreProducto: string | null;
  NombreElemento: string | null;
  ProporcionElemento: number | null;
  Toxicidad: number | null;
  Descripcion: string | null;
}

export interface ProductoRow extends RowDataPacket {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  toxicidad: number | null;
}

export interface PocionYPortadorRow extends RowDataPacket {
  id_asignacion: number;
  id_item: number;
  id_personaje: number;
  cantidad: number;
}

/* Payloads */
export type VItemReceta = {
  NombreElemento: string;
  ProporcionElemento: number;
};

export type RecetasViewFinal = {
  NombreProducto: string;
  Descripcion: string | null;
  Elementos: VItemReceta[]; // largo 5 (último es Base: Aceite/Grasa)
};

export type CraftRequest = {
  Receta: RecetasViewFinal;
  IdCrafter: number;
};
