import { SysObjectIdRow, sysobjectIdRowMapper, SysObjectIdRowSchema } from '@shared/infrastructure/adapters/drivens/sysobject-id.mapper'
import { describe, expect, it } from 'vitest'

function buildRow(overrides: Partial<SysObjectIdRow> = {}): SysObjectIdRow {
  return {
    object_id: 42,
    ...overrides,
  }
}

describe('sysobjectIdRowMapper', () => {
  it('debería traducir la fila al id del objeto', () => {
    expect(sysobjectIdRowMapper(buildRow())).toBe(42)
  })

  it('debería conservar el NULL que devuelve OBJECT_ID cuando el objeto no existe', () => {
    expect(sysobjectIdRowMapper(buildRow({ object_id: null }))).toBeNull()
  })
})

describe('SysObjectIdRowSchema', () => {
  it('debería modelar un object_id nulo como nullable en vez de rechazarlo', () => {
    expect(SysObjectIdRowSchema.parse({ object_id: null })).toEqual({ object_id: null })
  })

  it('debería fallar si la consulta no devuelve object_id', () => {
    expect(() => SysObjectIdRowSchema.parse({})).toThrow()
  })
})
