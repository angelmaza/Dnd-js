// src/entidades/alchemy.ts

export interface ElementoRow {
  id_elemento: number;
  nombre: string;
  cantidad: number | null;
  color?: string | null;
}

export interface VAlchemyProporcionesRow {
  // vista V_ALCHEMY_PROPORCIONES (ajusta a tus columnas reales)
  Id: number;                     // id_producto
  NombreProducto: string | null;
  NombreElemento: string | null;
  ProporcionElemento: number | null;
  Toxicidad: number | null;
  Descripcion: string | null;
}

export interface ProductoRow {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  toxicidad: number | null;
}

export interface PocionYPortadorRow {
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
