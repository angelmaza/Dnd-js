// src/entidades/db.ts
import type { RowDataPacket } from "mysql2/promise";

/** Útil para columnas BOOLEAN/TINYINT(1) que devolvemos como 0|1 */
export type BoolTiny = 0 | 1;

/* ========== TABLAS ========== */

/** Tabla: Dinero */
export interface DineroRow extends RowDataPacket {
  id_moneda: number;
  nombre: string | null;
  cantidad: number | null;
}

/** Tabla: Elementos */
export interface ElementoRow extends RowDataPacket {
  id_elemento: number;
  nombre: string | null;
  color: string | null;
  cantidad: number | null;
}

/** Tabla: Inventario */
export interface InventarioRow extends RowDataPacket {
  id_item: number;
  nombre: string | null;
  info_item: string | null; // VARCHAR(250)
}

/** Tabla: Productos */
export interface ProductoRow extends RowDataPacket {
  id_producto: number;
  nombre: string | null;        // VARCHAR(20)
  toxicidad: number | null;     // INT
  descripcion: string | null;   // VARCHAR(1000)
}

/** Tabla: Personajes */
export interface PersonajeRow extends RowDataPacket {
  id_pj: number;
  nombre: string | null;
  informacion: string | null;   // VARCHAR(1000)
  imagen: string | null;        // VARCHAR(50)
  imagen_fondo: string | null;  // VARCHAR(50)
}

/** Tabla: Npcs */
export interface NpcRow extends RowDataPacket {
  id_npc: number;
  nombre: string | null;
  imagen: string | null;
  imagen_fondo: string | null;
  informacion: string | null;   // LONGTEXT (string en TS)
  clasificacion: string | null;
}

/** Tabla: Misiones */
export interface MisionRow extends RowDataPacket {
  id_mision: number;
  titulo: string | null;
  zona: string | null;
  npc: string | null;
  descripcion: string | null;   // VARCHAR(1000)
  importancia: number | null;   // INT
  recompensa: string | null;    // VARCHAR(250)
  completada: BoolTiny;         // BOOLEAN -> 0 | 1
}

/** Tabla: Materiales */
export interface MaterialRow extends RowDataPacket {
  id_material: number;
  nombre: string | null;
  cantidad: number | null;
}

/** Tabla: Mats_extraidos */
export interface MatsExtraidoRow extends RowDataPacket {
  id: number;
  id_material: number | null;   // FK -> Materiales.id_material
  id_elemento: number | null;   // FK -> Elementos.id_elemento
  cant_extraible: number;       // NOT NULL
}

/** Tabla: Inventario_Y_Portador */
export interface InventarioYPortadorRow extends RowDataPacket {
  id_asignacion: number;
  id_item: number;              // FK -> Inventario.id_item
  id_personaje: number;         // FK -> Personajes.id_pj
  cantidad: number;
}

/** Tabla: Pocion_Y_Portador */
export interface PocionYPortadorRow extends RowDataPacket {
  id_asignacion: number;
  id_item: number;              // FK -> Productos.id_producto
  id_personaje: number;         // FK -> Personajes.id_pj
  cantidad: number;
}

/** Tabla: Recetas_producto_elemento */
export interface RecetaProductoElementoRow extends RowDataPacket {
  id: number;
  id_producto: number | null;   // FK -> Productos.id_producto
  id_elemento: number | null;   // FK -> Elementos.id_elemento
  proporcion: number | null;
}

/** Tabla: Lore */
export interface LoreRow extends RowDataPacket {
  id_lore: number;
  titulo: string | null;
  texto: string | null;         // LONGTEXT
}

/* ========== VISTAS ========== */
/* OJO: las propiedades respetan exactamente los alias/nombres definidos en la vista */

/** Vista: V_ALCHEMY_PROPORCIONES */
export interface VAlchemyProporcionesRow extends RowDataPacket {
  Id: number;                   // id_producto
  NombreProducto: string | null;
  NombreElemento: string | null;
  ProporcionElemento: number | null;
  Toxicidad: number | null;
  Descripcion: string | null;
}

/** Vista: V_Equipaje_Personajes */
export interface VEquipajePersonajesRow extends RowDataPacket {
  id_pj: number;
  IdItemOPocion: number;        // item o poción según el registro
  Personaje: string | null;     // nombre del personaje
  Nombre: string | null;        // nombre del item/poción
  info_item: string | null;     // info del item o descripcion del producto
  Toxicidad: number | null;     // NULL para items, valor para pociones
  Cantidad: number | null;
  Tipo: string | null;          // 'Item' | 'Pocion'
}
