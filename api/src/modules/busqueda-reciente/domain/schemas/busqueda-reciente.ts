import { TypeSysObject } from '@sysobject/domain/schemas/sysobject'

/**
 * Datos de entrada para registrar una búsqueda reciente.
 */
export interface BusquedaReciente {
  /** ID de la búsqueda reciente (hash MD5 de userId:database:schema:objectName) */
  id: string

  /** ID del usuario que realizó la búsqueda */
  idUser: number

  /** Nombre de la base de datos donde se realizó la búsqueda */
  database: string

  /** Esquema dentro de la base de datos */
  schema: string

  /** Nombre del objeto buscado (tabla, vista, procedimiento, etc.) */
  objectName: string

  /** Tipo del objeto buscado (ej. 'T' para tabla, 'V' para vista) */
  type: string

  /** Fecha y hora en que se realizó la búsqueda */
  dateSearch: Date | string

  /** Indica si la búsqueda está activa (usada reactivar una búsqueda reciente) */
  isActive: boolean
}

/**
 * Datos de entrada para registrar una búsqueda reciente.
 */
// export type BusquedaRecienteInput = Omit<BusquedaReciente, 'id' | 'objectId'>
export type BusquedaRecienteInput = Omit<BusquedaReciente, 'id'>

/**
 * Filtro de búsqueda para la recuperación de Búsquedas Recientes.
 */
export type BusquedaRecienteFilter = Pick<BusquedaReciente, 'idUser' | 'database'> & {
  type: TypeSysObject
}

/**
 * Filtro de búsqueda para el repositorio en la recuperación de Búsquedas Recientes.
 */
export type BusquedaRecienteFilterRepo = Pick<BusquedaReciente, 'idUser' | 'database'> & {
  type: TypeSysObject
}

/**
 * Datos de respuesta del repositorio para obtener todas las búsquedas recientes.
 */
export type BusquedaRecienteRepoResponse = Pick<BusquedaReciente, 'id' | 'schema' | 'objectName' | 'dateSearch'>

/**
 * Datos de respuesta para obtener todas las búsquedas recientes (incluye el ID del objeto SQL).
 */
export type BusquedaRecienteResponse = BusquedaRecienteRepoResponse & {
  /** Identificador del objeto SQL; `null` cuando el objeto ya no existe en la base */
  objectId: number | null
}

/**
 * Contexto de ejecución para operaciones relacionadas con búsquedas recientes.
 * Contiene información mínima necesaria para identificar al usuario y la base de datos donde se ejecuta la operación.
 */
export type Context = Pick<BusquedaReciente, 'idUser' | 'database'>
