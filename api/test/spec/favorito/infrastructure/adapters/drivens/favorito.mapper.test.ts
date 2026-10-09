import {
  FavoritoEntityRow,
  favoritoEntityRowMapper,
  FavoritoEntityRowSchema,
  FavoritoListRowSchema,
  FavoritoRow,
  favoritoRowMapper,
  FavoritoRowSchema,
} from '@favorito/infrastructure/adapters/drivens/favorito.mapper'
import { describe, expect, it } from 'vitest'

const SCOPE_COLUMNS = {
  FavoriteScopeId: 1,
  ServerName: 'SRV_PROD',
  DatabaseName: 'RRHH',
}

function buildRow(overrides: Partial<FavoritoRow> = {}): FavoritoRow {
  return {
    idFavorito: 1,
    cSchema: 'dbo',
    cNombreObjeto: 'vw_orders',
    cType: 'V',
    dFecha: new Date('2026-01-01T00:00:00.000Z'),
    lVigente: true,
    ...SCOPE_COLUMNS,
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
      scope: { serverName: 'SRV_PROD', databaseName: 'RRHH' },
    })
  })

  it('debería mapear el alcance global (ambos nombres en null)', () => {
    const row = buildRow({ FavoriteScopeId: 0, ServerName: null, DatabaseName: null })

    expect(favoritoRowMapper(row).scope).toEqual({ serverName: null, databaseName: null })
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

  it('debería fallar si la consulta no proyecta las columnas de alcance', () => {
    const { FavoriteScopeId: _scopeId, ServerName: _serverName, DatabaseName: _databaseName, ...rowWithoutScope } = buildRow()

    expect(() => FavoritoRowSchema.parse(rowWithoutScope)).toThrow()
  })
})

describe('FavoritoListRowSchema', () => {
  it('debería exigir nTotal además de las columnas de la fila', () => {
    expect(() => FavoritoListRowSchema.parse(buildRow())).toThrow()
    expect(FavoritoListRowSchema.parse({ ...buildRow(), nTotal: 3 })).toEqual({ ...buildRow(), nTotal: 3 })
  })
})

function buildEntityRow(overrides: Partial<FavoritoEntityRow> = {}): FavoritoEntityRow {
  return {
    ...buildRow(),
    idUsuario: 7,
    ...overrides,
  }
}

describe('favoritoEntityRowMapper', () => {
  it('debería traducir la entidad al tipo del puerto incluyendo idUser', () => {
    expect(favoritoEntityRowMapper(buildEntityRow({ idFavorito: 101, idUsuario: 7, lVigente: false }))).toEqual({
      id: 101,
      idUser: 7,
      schema: 'dbo',
      objectName: 'vw_orders',
      type: 'V',
      date: new Date('2026-01-01T00:00:00.000Z'),
      isActive: false,
      scope: { serverName: 'SRV_PROD', databaseName: 'RRHH' },
    })
  })
})

describe('FavoritoEntityRowSchema', () => {
  it('debería fallar si la consulta no devuelve idUsuario', () => {
    const { idUsuario: _idUsuario, ...rowWithoutIdUsuario } = buildEntityRow()

    expect(() => FavoritoEntityRowSchema.parse(rowWithoutIdUsuario)).toThrow()
  })
})
