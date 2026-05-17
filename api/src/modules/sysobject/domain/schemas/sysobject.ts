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

  /** Indica si el objeto está marcado como parte del sistema de alineamiento. */
  // isAligmentObject: boolean
}

/**
 * Enum de tipos de objetos SQL utilizados en el sistema.
 *
 * Las claves representan el tipo semántico, mientras que los valores son los identificadores cortos
 * utilizados en la base de datos o como filtros.
 *
 * Valores:
 * - 'P'  → Procedimiento almacenado (`SQL_STORED_PROCEDURE`)
 * - 'FN' → Función escalar (`SQL_SCALAR_FUNCTION`)
 * - 'TR' → Trigger (`SQL_TRIGGER`)
 * - 'TF' → Función con valor de tabla (`SQL_TABLE_VALUED_FUNCTION`)
 * - 'IF' → Función tabular inline (`SQL_INLINE_TABLE_VALUED_FUNCTION`)
 * - 'V'  → Vista (`VIEW`)
 * - 'U'  → Tabla de usuario (`USER_TABLE`)
 * - 'ALL' → Todos los tipos de objeto.
 * - 'ALL_EXCEPT_USERTABLE' → Todos los tipos excepto `USER_TABLE`.
 */
export const TypeSysObjectEnum = {
  SQL_STORED_PROCEDURE: 'P',
  SQL_SCALAR_FUNCTION: 'FN',
  SQL_TRIGGER: 'TR',
  SQL_TABLE_VALUED_FUNCTION: 'TF',
  SQL_INLINE_TABLE_VALUED_FUNCTION: 'IF',
  VIEW: 'V',
  USER_TABLE: 'U',
  ALL: 'ALL',
  ALL_EXCEPT_USERTABLE: 'ALL_EXCEPT_USERTABLE',
} as const

export type TypeSysObject = (typeof TypeSysObjectEnum)[keyof typeof TypeSysObjectEnum]

export type ValidTypeSysObject = Exclude<TypeSysObject, 'ALL' | 'ALL_EXCEPT_USERTABLE'>

const AggregateTypeSysObjectValues = [TypeSysObjectEnum.ALL, TypeSysObjectEnum.ALL_EXCEPT_USERTABLE] as const

// obtiene solo los valores válidos (sin 'ALL' ni 'ALL_EXCEPT_USERTABLE')
export const ValidTypeSysObjectValues: ValidTypeSysObject[] = Object.values(TypeSysObjectEnum).filter(
  (v): v is ValidTypeSysObject => !AggregateTypeSysObjectValues.includes(v as (typeof AggregateTypeSysObjectValues)[number]),
)

export function resolveTypeSysObjectValues(type: TypeSysObject): ValidTypeSysObject[] {
  switch (type) {
    case TypeSysObjectEnum.ALL:
      return ValidTypeSysObjectValues
    case TypeSysObjectEnum.ALL_EXCEPT_USERTABLE:
      return ValidTypeSysObjectValues.filter(v => v !== TypeSysObjectEnum.USER_TABLE)
    default:
      return [type as ValidTypeSysObject]
  }
}
