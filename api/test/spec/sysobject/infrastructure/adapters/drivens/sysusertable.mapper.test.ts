import {
  columnExtendedPropertyRowMapper,
  ColumnRow,
  columnRowMapper,
  ForeignKeyRow,
  foreignKeyRowMapper,
  IndexRow,
  indexRowMapper,
  usertableExtendedPropertyRowMapper,
  UsertableSysObjectRow,
  usertableSysObjectRowMapper,
  UsertableSysObjectRowSchema,
} from '@sysobject/infrastructure/adapters/drivens/sysusertable.mapper'
import { describe, expect, it } from 'vitest'

function buildRow(overrides: Partial<UsertableSysObjectRow> = {}): UsertableSysObjectRow {
  return {
    object_id: 1,
    name: 'Clientes',
    type: 'U',
    type_desc: 'USER_TABLE',
    schema_id: 1,
    schema_name: 'dbo',
    // fechas locales a mediodía: así el formato no depende de la zona de la máquina.
    create_date: new Date(2026, 0, 1, 12, 0, 0),
    modify_date: new Date(2026, 0, 2, 12, 0, 0),
    ...overrides,
  }
}

function buildColumnRow(overrides: Partial<ColumnRow> = {}): ColumnRow {
  return {
    column_id: 1,
    name: 'id',
    type_name: 'varchar',
    max_length: 50,
    precision: 0,
    scale: 0,
    is_nullable: false,
    is_identity: true,
    default_definition: null,
    ...overrides,
  }
}

function buildIndexRow(overrides: Partial<IndexRow> = {}): IndexRow {
  return {
    index_name: 'PK_Clientes',
    type_desc: 'CLUSTERED',
    is_primary_key: true,
    is_unique: true,
    is_filtered: false,
    filter_definition: null,
    column_id: 1,
    column_name: 'id',
    key_ordinal: 1,
    is_descending_key: false,
    is_included_column: false,
    is_disabled: false,
    ...overrides,
  }
}

describe('UsertableSysObjectRowSchema', () => {
  it('debería quitar el relleno que agrega CHAR(2) en type', () => {
    expect(UsertableSysObjectRowSchema.parse(buildRow({ type: 'U ' })).type).toBe('U')
  })

  it('debería fallar si la consulta no devuelve schema_name', () => {
    const { schema_name: _schemaName, ...rowWithoutSchemaName } = buildRow()

    expect(() => UsertableSysObjectRowSchema.parse(rowWithoutSchemaName)).toThrow()
  })
})

describe('usertableSysObjectRowMapper', () => {
  it('debería traducir la fila al tipo del puerto', () => {
    expect(usertableSysObjectRowMapper(buildRow())).toEqual({
      id: 1,
      name: 'Clientes',
      type: 'U',
      typeDesc: 'USER_TABLE',
      schemaId: 1,
      schemaName: 'dbo',
      createDate: '01-01-2026',
      modifyDate: '02-01-2026',
    })
  })
})

describe('columnRowMapper', () => {
  it('debería traducir la columna, formatear el tipo y conservar el default nulo', () => {
    expect(columnRowMapper(buildColumnRow(), [])).toEqual({
      id: 1,
      name: 'id',
      type: 'varchar(50)',
      isNullable: false,
      isIdentity: true,
      defaultDefinition: null,
      extendedProperties: [],
    })
  })
})

describe('columnExtendedPropertyRowMapper', () => {
  it('debería traducir la propiedad extendida de una columna', () => {
    expect(columnExtendedPropertyRowMapper({ column_id: 1, value: 'comentario', name: 'MS_Description' })).toEqual({
      propertyValue: 'comentario',
      propertyName: 'MS_Description',
    })
  })
})

describe('usertableExtendedPropertyRowMapper', () => {
  it('debería traducir la propiedad extendida de la tabla', () => {
    expect(usertableExtendedPropertyRowMapper({ value: 'etiqueta', name: 'MS_Description' })).toEqual({
      propertyValue: 'etiqueta',
      propertyName: 'MS_Description',
    })
  })
})

describe('foreignKeyRowMapper', () => {
  it('debería traducir la clave foránea al tipo del puerto', () => {
    const row: ForeignKeyRow = {
      column_id: 2,
      referenced_schema: 'dbo',
      referenced_object_id: 9,
      referenced_object: 'Pedidos',
      referenced_column_id: 1,
      referenced_column: 'id',
    }

    expect(foreignKeyRowMapper(row)).toEqual({
      columnId: 2,
      referencedSchema: 'dbo',
      referencedObjectId: 9,
      referencedObject: 'Pedidos',
      referencedColumnId: 1,
      referencedColumn: 'id',
    })
  })
})

describe('indexRowMapper', () => {
  it('debería traducir la fila a un índice con su única columna y conservar el filtro nulo', () => {
    expect(indexRowMapper(buildIndexRow())).toEqual({
      name: 'PK_Clientes',
      typeDesc: 'CLUSTERED',
      isPrimaryKey: true,
      isUnique: true,
      isFiltered: false,
      filterDefinition: null,
      isDisabled: false,
      columns: [{ columnId: 1, columnName: 'id', keyOrdinal: 1, isDescendingKey: false, isIncludedColumn: false }],
    })
  })
})
