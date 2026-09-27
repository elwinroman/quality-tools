import {
  prodPermissionRolRowMapper,
  ProdPermissionRolRowSchema,
  ProdSysObjectRow,
  prodSysObjectRowMapper,
  ProdSysObjectRowSchema,
} from '@sysobject/infrastructure/adapters/drivens/prod-sysobject.mapper'
import { describe, expect, it } from 'vitest'

function buildRow(overrides: Partial<ProdSysObjectRow> = {}): ProdSysObjectRow {
  return {
    object_id: 1,
    name: 'vw_orders',
    type: 'V',
    type_desc: 'VIEW',
    schema_id: 1,
    schema_name: 'dbo',
    // fechas locales a mediodía: así el formato no depende de la zona de la máquina.
    create_date: new Date(2026, 0, 1, 12, 0, 0),
    modify_date: new Date(2026, 0, 2, 12, 0, 0),
    definition: 'CREATE VIEW dbo.vw_orders AS SELECT 1',
    ...overrides,
  }
}

describe('ProdSysObjectRowSchema', () => {
  it('debería quitar el relleno que agrega CHAR(2) en type', () => {
    expect(ProdSysObjectRowSchema.parse(buildRow({ type: 'V ' })).type).toBe('V')
  })

  it('debería fallar si el procedimiento no devuelve definition', () => {
    const { definition: _definition, ...rowWithoutDefinition } = buildRow()

    expect(() => ProdSysObjectRowSchema.parse(rowWithoutDefinition)).toThrow()
  })
})

describe('prodSysObjectRowMapper', () => {
  it('debería traducir la fila al tipo del puerto', () => {
    expect(prodSysObjectRowMapper(buildRow())).toEqual({
      id: 1,
      name: 'vw_orders',
      type: 'V',
      typeDesc: 'VIEW',
      schemaId: 1,
      schemaName: 'dbo',
      createDate: '01-01-2026',
      modifyDate: '02-01-2026',
      definition: 'CREATE VIEW dbo.vw_orders AS SELECT 1',
    })
  })
})

describe('prodPermissionRolRowMapper', () => {
  it('debería traducir la fila de permisos al tipo del puerto', () => {
    const row = ProdPermissionRolRowSchema.parse({
      state_desc: 'GRANT',
      permission_name: 'SELECT',
      rol: 'db_datareader',
    })

    expect(prodPermissionRolRowMapper(row)).toEqual({
      stateDesc: 'GRANT',
      permissionName: 'SELECT',
      name: 'db_datareader',
    })
  })
})
