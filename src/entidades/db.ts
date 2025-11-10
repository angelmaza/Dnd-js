// src/entidades/db.ts

/** Útil para columnas BOOLEAN/TINYINT(1) que devolvemos como 0|1 */
export type BoolTiny = 0 | 1;

/* ========== TABLAS ========== */

/** Tabla: Dinero */
export interface DineroRow {
  id_moneda: number;
  nombre: string | null;
  cantidad: number | null;
}



/** Tabla: Elementos */
export interface ElementoRow {
  id_elemento: number;
  nombre: string | null;
  color: string | null;
  cantidad: number | null;
}

/** Tabla: Inventario */
export interface InventarioRow {
  id_item: number;
  nombre: string | null;
  info_item: string | null; // VARCHAR(250)
}

/** Tabla: Productos */
export interface ProductoRow {
  id_producto: number;
  nombre: string | null;        // VARCHAR(20)
  toxicidad: number | null;     // INT
  descripcion: string | null;   // VARCHAR(1000)
}

/** Tabla: Personajes */
export interface PersonajeRow {
  id_pj: number;
  nombre: string | null;
  informacion: string | null;   // VARCHAR(1000)
  imagen: string | null;        // VARCHAR(50)
  imagen_fondo: string | null;  // VARCHAR(50)
}

/** Tabla: Npcs */
export interface NpcRow {
  id_npc: number;
  nombre: string | null;
  imagen: string | null;
  imagen_fondo: string | null;
  informacion: string | null;   // LONGTEXT
  clasificacion: string | null;
}

/** Tabla: Misiones */
export interface MisionRow {
  id_mision: number;
  titulo: string | null;
  zona: string | null;
  npc: string | null;
  descripcion: string | null;   // VARCHAR(1000)
  importancia: number | null;   // INT
  recompensa: string | null;    // VARCHAR(250)
  completada: BoolTiny;         // 0 | 1
}

/** Tabla: Materiales */
export interface MaterialRow {
  id_material: number;
  nombre: string | null;
  cantidad: number | null;
}

/** Tabla: Mats_extraidos */
export interface MatsExtraidoRow {
  id: number;
  id_material: number | null;   // FK -> Materiales.id_material
  id_elemento: number | null;   // FK -> Elementos.id_elemento
  cant_extraible: number;       // NOT NULL
}

/** Tabla: Inventario_Y_Portador */
export interface InventarioYPortadorRow {
  id_asignacion: number;
  id_item: number;              // FK -> Inventario.id_item
  id_personaje: number;         // FK -> Personajes.id_pj
  cantidad: number;
}

/** Tabla: Pocion_Y_Portador */
export interface PocionYPortadorRow {
  id_asignacion: number;
  id_item: number;              // FK -> Productos.id_producto
  id_personaje: number;         // FK -> Personajes.id_pj
  cantidad: number;
}

/** Tabla: Recetas_producto_elemento */
export interface RecetaProductoElementoRow {
  id: number;
  id_producto: number | null;   // FK -> Productos.id_producto
  id_elemento: number | null;   // FK -> Elementos.id_elemento
  proporcion: number | null;
}

/** Tabla: Lore */
export interface LoreRow {
  id_lore: number;
  titulo: string | null;
  texto: string | null;         // LONGTEXT
}

/* ========== VISTAS ========== */

/** Vista: V_ALCHEMY_PROPORCIONES */
export interface VAlchemyProporcionesRow {
  Id: number;                   // id_producto
  NombreProducto: string | null;
  NombreElemento: string | null;
  ProporcionElemento: number | null;
  Toxicidad: number | null;
  Descripcion: string | null;
}

/** Vista: V_Equipaje_Personajes */
export interface VEquipajePersonajesRow {
  id_pj: number;
  IdItemOPocion: number;
  Personaje: string | null;
  Nombre: string | null;
  info_item: string | null;
  Toxicidad: number | null;
  Cantidad: number | null;
  Tipo: string | null;          // 'Item' | 'Pocion'
}

/** Uso puntual para SELECT cantidad FROM ... */
export interface CantidadRow {
  cantidad: number;
}
