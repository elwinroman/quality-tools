import { format } from '@formkit/tempo'
import { Column, ExtendedProperty, ForeignKey, Index, UsertableSysObject } from '@sysobject/domain/schemas/usertable'
import { formatSQLDataType } from '@sysobject/infrastructure/utils/format-sql-data-type.util'
import { z } from 'zod'

// ── getBySchemaAndName ──────────────────────────────────────────────────────

export const UsertableSysObjectRowSchema = z.object({
  object_id: z.number().int(),
  name: z.string(),
  // type es CHAR(2) en la base, así que vuelve con relleno ('U ').
  type: z.string().trim(),
  type_desc: z.string(),
  schema_id: z.number().int(),
  schema_name: z.string(),
  create_date: z.date(),
  modify_date: z.date(),
})

export type UsertableSysObjectRow = z.infer<typeof UsertableSysObjectRowSchema>

export function usertableSysObjectRowMapper(row: UsertableSysObjectRow): UsertableSysObject {
  return {
    id: row.object_id,
    name: row.name,
    type: row.type,
    typeDesc: row.type_desc,
    schemaId: row.schema_id,
    schemaName: row.schema_name,
    createDate: format(row.create_date, 'DD-MM-YYYY'),
    modifyDate: format(row.modify_date, 'DD-MM-YYYY'),
  }
}

// ── getColumnsById ──────────────────────────────────────────────────────────

export const ColumnRowSchema = z.object({
  column_id: z.number().int(),
  name: z.string(),
  type_name: z.string(),
  max_length: z.number().int(),
  precision: z.number().int(),
  scale: z.number().int(),
  is_nullable: z.boolean(),
  is_identity: z.boolean(),
  // viene de un LEFT JOIN, así que puede faltar el default.
  default_definition: z.string().nullable(),
})

export type ColumnRow = z.infer<typeof ColumnRowSchema>

/**
 * Las propiedades extendidas ya vienen traducidas; el adapter las agrupa por `column_id`
 * antes de llamar acá, porque la consulta las devuelve como un recordset aparte.
 */
export function columnRowMapper(row: ColumnRow, extendedProperties: ExtendedProperty[]): Column {
  return {
    id: row.column_id,
    name: row.name,
    type: formatSQLDataType(row.type_name, row.max_length, row.precision, row.scale),
    isNullable: row.is_nullable,
    isIdentity: row.is_identity,
    defaultDefinition: row.default_definition,
    extendedProperties,
  }
}

export const ColumnExtendedPropertyRowSchema = z.object({
  column_id: z.number().int(),
  value: z.string(),
  name: z.string(),
})

export type ColumnExtendedPropertyRow = z.infer<typeof ColumnExtendedPropertyRowSchema>

export function columnExtendedPropertyRowMapper(row: ColumnExtendedPropertyRow): ExtendedProperty {
  return {
    propertyValue: row.value,
    propertyName: row.name,
  }
}

// ── getForeignKeysById ──────────────────────────────────────────────────────

export const ForeignKeyRowSchema = z.object({
  column_id: z.number().int(),
  referenced_schema: z.string(),
  referenced_object_id: z.number().int(),
  referenced_object: z.string(),
  referenced_column_id: z.number().int(),
  referenced_column: z.string(),
})

export type ForeignKeyRow = z.infer<typeof ForeignKeyRowSchema>

export function foreignKeyRowMapper(row: ForeignKeyRow): ForeignKey {
  return {
    columnId: row.column_id,
    referencedSchema: row.referenced_schema,
    referencedObjectId: row.referenced_object_id,
    referencedObject: row.referenced_object,
    referencedColumnId: row.referenced_column_id,
    referencedColumn: row.referenced_column,
  }
}

// ── getIndexesById ──────────────────────────────────────────────────────────

/**
 * La consulta devuelve una fila por (índice, columna): los metadatos del índice
 * vienen repetidos en cada fila. El mapper arma un `Index` con la única columna de
 * esa fila y el adapter los agrupa por nombre.
 */
export const IndexRowSchema = z.object({
  index_name: z.string(),
  type_desc: z.string(),
  is_primary_key: z.boolean(),
  is_unique: z.boolean(),
  is_filtered: z.boolean(),
  // null cuando el índice no tiene cláusula WHERE.
  filter_definition: z.string().nullable(),
  column_id: z.number().int(),
  column_name: z.string(),
  key_ordinal: z.number().int(),
  is_descending_key: z.boolean(),
  is_included_column: z.boolean(),
  is_disabled: z.boolean(),
})

export type IndexRow = z.infer<typeof IndexRowSchema>

export function indexRowMapper(row: IndexRow): Index {
  return {
    name: row.index_name,
    typeDesc: row.type_desc,
    isPrimaryKey: row.is_primary_key,
    isUnique: row.is_unique,
    isFiltered: row.is_filtered,
    filterDefinition: row.filter_definition,
    isDisabled: row.is_disabled,
    columns: [
      {
        columnId: row.column_id,
        columnName: row.column_name,
        keyOrdinal: row.key_ordinal,
        isDescendingKey: row.is_descending_key,
        isIncludedColumn: row.is_included_column,
      },
    ],
  }
}

// ── getUsertableExtendedPropertieById ───────────────────────────────────────

export const UsertableExtendedPropertyRowSchema = z.object({
  value: z.string(),
  name: z.string(),
})

export type UsertableExtendedPropertyRow = z.infer<typeof UsertableExtendedPropertyRowSchema>

export function usertableExtendedPropertyRowMapper(row: UsertableExtendedPropertyRow): ExtendedProperty {
  return {
    propertyValue: row.value,
    propertyName: row.name,
  }
}
