import { Permission } from '../object.model'

/**
 * Representa un objeto definido dentro de una base de datos SQL,
 * como una vista, procedimiento almacenado, función o similar.
 * Incluye metadatos relevantes como esquema, tipo, fechas y definición del objeto.
 * NOTA: Es excluyente para el objeto tipo USER_TABLE
 */
export interface SysObject {
  /** Identificador único del objeto dentro del sistema. */
  id: number

  /** Nombre del objeto (ej. nombre de una vista, función o SP). */
  name: string

  /** Tipo del objeto (por ejemplo: 'V', 'FN', 'SP'). */
  type: string

  /** Descripción detallada o extendida del tipo (por ejemplo: 'SQL_SCALAR_FUNCTION'). */
  typeDesc: string

  /** Identificador del esquema en la base de datos. */
  schemaId: number

  /** Nombre del esquema al que pertenece el objeto (ej. 'dbo', 'public'). */
  schemaName: string

  /** Fecha de creación del objeto en la base de datos (UTC). */
  createDate: Date | string

  /** Fecha de última modificación del objeto (UTC). */
  modifyDate: Date | string

  /** Definición del objeto en formato SQL (código fuente). */
  definition: string
}

export type FullSysObject = SysObject & {
  permission: Permission[]
}

export interface SysObjectRelation {
  id: number | null
  name: string
  schemaName: string | null
  typeDesc: string
}
