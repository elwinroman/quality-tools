import {
  permissionRolRowMapper,
  sysObjectRelationRowMapper,
  SysObjectRelationRowSchema,
  SysObjectRow,
  sysObjectRowMapper,
  SysObjectRowSchema,
  sysObjectSummaryRowMapper,
} from '@sysobject/infrastructure/adapters/drivens/sysobject.mapper'
import { describe, expect, it } from 'vitest'

function buildRow(overrides: Partial<SysObjectRow> = {}): SysObjectRow {
  return {
    object_id: 1,
    name: 'vw_orders',
    type: 'V',
    type_desc: 'VIEW',
    schema_id: 1,
    schema_name: 'dbo',
    create_date: new Date('2026-01-01T00:00:00.000Z'),
    modify_date: new Date('2026-01-02T00:00:00.000Z'),
    definition: 'CREATE VIEW dbo.vw_orders AS SELECT 1',
    ...overrides,
  }
}

describe('SysObjectRowSchema', () => {
  it('debería quitar el relleno que agrega CHAR(2) en type', () => {
    expect(SysObjectRowSchema.parse(buildRow({ type: 'V ' })).type).toBe('V')
  })

  it('debería fallar si la consulta no devuelve definition', () => {
    const { definition: _definition, ...rowWithoutDefinition } = buildRow()

    expect(() => SysObjectRowSchema.parse(rowWithoutDefinition)).toThrow()
  })
})

describe('sysObjectRowMapper', () => {
  it('debería traducir la fila y anclar las fechas a la zona de la base', () => {
    const mapped = sysObjectRowMapper(buildRow(), 'America/Lima')

    expect(mapped.id).toBe(1)
    expect(mapped.name).toBe('vw_orders')
    expect(mapped.schemaId).toBe(1)
    expect(mapped.schemaName).toBe('dbo')
    expect(mapped.typeDesc).toBe('VIEW')
    // 00:00 en Lima (UTC-5) es 05:00 UTC
    expect(mapped.createDate).toEqual(new Date('2026-01-01T05:00:00.000Z'))
    expect(mapped.modifyDate).toEqual(new Date('2026-01-02T05:00:00.000Z'))
  })
})

describe('sysObjectSummaryRowMapper', () => {
  it('debería traducir la fila del listado y quitar el relleno de type_desc', () => {
    expect(
      sysObjectSummaryRowMapper({
        object_id: 7,
        name: 'sp_x',
        schema_name: 'dbo',
        type_desc: 'SQL_STORED_PROCEDURE ',
        peso: 1,
      }),
    ).toEqual({ id: 7, name: 'sp_x', schemaName: 'dbo', typeDesc: 'SQL_STORED_PROCEDURE' })
  })
})

describe('sysObjectRelationRowMapper', () => {
  it('debería conservar los nulos de la relación y vaciar un type_desc ausente', () => {
    const row = SysObjectRelationRowSchema.parse({
      object_id: null,
      schema_name: null,
      object_name: 'vw_orders',
      type_desc: null,
    })

    expect(sysObjectRelationRowMapper(row)).toEqual({ id: null, name: 'vw_orders', schemaName: null, typeDesc: '' })
  })
})

describe('permissionRolRowMapper', () => {
  it('debería traducir la fila de permisos al tipo del puerto', () => {
    expect(permissionRolRowMapper({ state_desc: 'GRANT', permission_name: 'SELECT', rol: 'db_datareader' })).toEqual({
      stateDesc: 'GRANT',
      permissionName: 'SELECT',
      name: 'db_datareader',
    })
  })
})
