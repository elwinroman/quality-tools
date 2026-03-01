import type { BaseSysObjectType } from '@/models/sysobject'

/** Metadatos del objeto usertable */
export interface UserTableObject {
  id: number
  name: string
  type: BaseSysObjectType
  typeDesc: string
  schemaName: string
  createDate: Date | string
  modifyDate: Date | string
}

/** Propiedad extendida de una columna */
export interface ExtendedProperty {
  propertyName: string
  propertyValue: string
}

/** Columna de una tabla */
export interface UserTableColumn {
  id: number
  name: string
  type: string
  isNullable: boolean
  isIdentity: boolean
  defaultDefinition: string | null
  extendedProperties: ExtendedProperty[]
}

/** Columna que compone un índice (clave o incluida) */
export interface UserTableIndexColumn {
  columnId: number
  columnName: string
  keyOrdinal: number
  isDescendingKey: boolean
  isIncludedColumn: boolean
}

/** Índice de una tabla */
export interface UserTableIndex {
  name: string
  typeDesc: string
  isPrimaryKey: boolean
  isUnique: boolean
  isFiltered: boolean
  filterDefinition: string | null
  columns: UserTableIndexColumn[]
}

/** Foreign key de una tabla */
export interface UserTableForeignKey {
  columnId: number
  referencedSchema: string
  referencedObject: string
}

/** Respuesta de la API para usertable (hereda de SysObject sin definition) */
export interface UserTableApiResponse {
  correlationId: string
  data: {
    id: number
    name: string
    type: BaseSysObjectType
    typeDesc: string
    schemaId: number
    schemaName: string
    createDate: Date | string
    modifyDate: Date | string
    extendedProperties: ExtendedProperty[]
    columns: UserTableColumn[]
    indexes: UserTableIndex[]
    foreignKeys: UserTableForeignKey[]
  }
}
