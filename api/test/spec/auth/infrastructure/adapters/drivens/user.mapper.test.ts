import { UserHashId } from '@auth/domain/value-objects/user-hash-id'
import { UserRow, userRowMapper, UserRowSchema } from '@auth/infrastructure/adapters/drivens/user.mapper'
import { describe, expect, it } from 'vitest'

// hash válido para el usuario y host por defecto: el factory del dominio lo revalida
const validHash = UserHashId.generate('jdoe', 'db-host')

function buildRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    idUsuario: 1,
    cHashUsuarioUID: validHash,
    cUsuario: 'jdoe',
    cServer: 'db-host',
    cAliasServer: 'alias-host',
    dFechaRegistro: new Date('2026-01-01T00:00:00.000Z'),
    lVigente: true,
    ...overrides,
  }
}

describe('userRowMapper', () => {
  it('debería traducir la fila al usuario de repositorio y normalizar el nombre', () => {
    const mapped = userRowMapper(buildRow({ idUsuario: 7, cUsuario: 'JDOE' }))

    expect(mapped.id).toBe(7)
    expect(mapped.user).toBe('jdoe')
    expect(mapped.hashId.getValue).toBe(validHash)
    expect(mapped.host).toBe('db-host')
    expect(mapped.aliasHost).toBe('alias-host')
    expect(mapped.createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'))
    expect(mapped.isActive).toBe(true)
    expect(mapped.role).toBe('analista')
  })
})

describe('UserRowSchema', () => {
  it('debería fallar si la consulta no devuelve cHashUsuarioUID', () => {
    const { cHashUsuarioUID: _cHashUsuarioUID, ...rowWithoutHash } = buildRow()

    expect(() => UserRowSchema.parse(rowWithoutHash)).toThrow()
  })
})
