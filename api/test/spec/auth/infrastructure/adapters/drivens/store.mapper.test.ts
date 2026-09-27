import {
  DatabaseNameRow,
  databaseNameRowMapper,
  StoreDetailsRow,
  storeDetailsRowMapper,
  StoreDetailsRowSchema,
  StorePermissionRow,
  storePermissionRowMapper,
} from '@auth/infrastructure/adapters/drivens/store.mapper'
import { describe, expect, it } from 'vitest'

function buildDetailsRow(overrides: Partial<StoreDetailsRow> = {}): StoreDetailsRow {
  return {
    name: 'Produccion',
    cmptlevel: 150,
    value: 'Base de producción',
    server_name: 'SQL01',
    ...overrides,
  }
}

describe('storeDetailsRowMapper', () => {
  it('debería traducir la fila de detalles e inyectar la base de pre-producción', () => {
    expect(storeDetailsRowMapper(buildDetailsRow(), 'PREPROD')).toEqual({
      name: 'Produccion',
      // el nivel de compatibilidad viaja numérico, como lo espera el frontend
      compatibility: 150,
      description: 'Base de producción',
      server: 'SQL01',
      prodDatabase: 'PREPROD',
    })
  })

  it('debería conservar la descripción nula cuando no hay propiedad extendida', () => {
    expect(storeDetailsRowMapper(buildDetailsRow({ value: null }), 'PREPROD').description).toBeNull()
  })
})

describe('StoreDetailsRowSchema', () => {
  it('debería fallar si la consulta no devuelve cmptlevel', () => {
    const { cmptlevel: _cmptlevel, ...rowWithoutCmptlevel } = buildDetailsRow()

    expect(() => StoreDetailsRowSchema.parse(rowWithoutCmptlevel)).toThrow()
  })
})

describe('storePermissionRowMapper', () => {
  it('debería traducir el permiso de VIEW DEFINITION', () => {
    const row: StorePermissionRow = { viewdefinition_permission: true }

    expect(storePermissionRowMapper(row)).toEqual({ viewdefinitionPermission: true })
  })
})

describe('databaseNameRowMapper', () => {
  it('debería traducir la fila al nombre de la base', () => {
    const row: DatabaseNameRow = { name: 'Produccion' }

    expect(databaseNameRowMapper(row)).toBe('Produccion')
  })
})
