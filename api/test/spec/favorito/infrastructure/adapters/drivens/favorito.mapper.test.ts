import {
  decodeRow,
  decodeRows,
  FavoritoListRowSchema,
  FavoritoRow,
  favoritoRowMapper,
  FavoritoRowSchema,
} from '@favorito/infrastructure/adapters/drivens/favorito.mapper'
import { describe, expect, it } from 'vitest'

function buildRow(overrides: Partial<FavoritoRow> = {}): FavoritoRow {
  return {
    idFavorito: 1,
    cSchema: 'dbo',
    cNombreObjeto: 'vw_orders',
    cType: 'V',
    dFecha: new Date('2026-01-01T00:00:00.000Z'),
    lVigente: true,
    ...overrides,
  }
}

describe('favoritoRowMapper', () => {
  it('debería traducir la fila de la base al tipo del puerto', () => {
    expect(favoritoRowMapper(buildRow({ idFavorito: 101, lVigente: false }))).toEqual({
      id: 101,
      schema: 'dbo',
      objectName: 'vw_orders',
      type: 'V',
      date: new Date('2026-01-01T00:00:00.000Z'),
      isActive: false,
    })
  })
})

describe('FavoritoRowSchema', () => {
  it('debería fallar si la consulta no devuelve lVigente', () => {
    const rowWithoutLVigente = {
      idFavorito: 1,
      cSchema: 'dbo',
      cNombreObjeto: 'vw_orders',
      cType: 'V',
      dFecha: new Date('2026-01-01T00:00:00.000Z'),
    }

    expect(() => FavoritoRowSchema.parse(rowWithoutLVigente)).toThrow()
  })

  it('debería quitar el relleno que agrega CHAR(2) en cType', () => {
    expect(FavoritoRowSchema.parse(buildRow({ cType: 'V ' })).cType).toBe('V')
  })

  it('debería rechazar una dFecha que no sea Date', () => {
    expect(() => FavoritoRowSchema.parse({ ...buildRow(), dFecha: '2026-01-01T00:00:00.000Z' })).toThrow()
  })
})

describe('FavoritoListRowSchema', () => {
  it('debería exigir nTotal además de las columnas de la fila', () => {
    expect(() => FavoritoListRowSchema.parse(buildRow())).toThrow()
    expect(FavoritoListRowSchema.parse({ ...buildRow(), nTotal: 3 })).toEqual({ ...buildRow(), nTotal: 3 })
  })
})

describe('decodeRow', () => {
  it('debería devolver null cuando la consulta no trae filas', () => {
    expect(decodeRow([], FavoritoRowSchema)).toBeNull()
    expect(decodeRow(undefined, FavoritoRowSchema)).toBeNull()
  })

  it('debería devolver la fila validada cuando la forma coincide', () => {
    expect(decodeRow([buildRow()], FavoritoRowSchema)).toEqual(buildRow())
  })

  it('debería lanzar cuando la fila existe pero no coincide con el schema', () => {
    expect(() => decodeRow([{ ...buildRow(), lVigente: 1 }], FavoritoRowSchema)).toThrow()
  })
})

describe('decodeRows', () => {
  it('debería devolver una lista vacía cuando no hay filas', () => {
    expect(decodeRows(undefined, FavoritoListRowSchema)).toEqual([])
  })

  it('debería validar cada fila de la lista', () => {
    const row = { ...buildRow(), nTotal: 2 }

    expect(decodeRows([row], FavoritoListRowSchema)).toEqual([row])
    expect(() => decodeRows([buildRow()], FavoritoListRowSchema)).toThrow()
  })
})
