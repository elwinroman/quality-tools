import { User, UserRoleList } from '@auth/domain/schemas/user'
import { UserHashId } from '@auth/domain/value-objects/user-hash-id'
import { describe, expect, it } from 'vitest'

const CREATED_AT = '2025-01-15T10:00:00.000Z'

function buildParams() {
  return {
    user: 'uMonitor',
    host: 'SQLSERVER01',
    aliasHost: 'SERVIDOR-ALIAS',
    createdAt: CREATED_AT,
  }
}

function buildPersistedParams() {
  return {
    ...buildParams(),
    id: 7,
    hashId: UserHashId.generate('uMonitor', 'SQLSERVER01'),
  }
}

describe('User', () => {
  describe('create', () => {
    it('debería aplicar el rol analista por defecto', () => {
      expect(User.create(buildParams()).toValue().role).toBe(UserRoleList.ANALIST)
    })

    it('debería aplicar vigente por defecto', () => {
      expect(User.create(buildParams()).toValue().isActive).toBe(true)
    })

    it('debería normalizar el nombre de usuario a minúsculas', () => {
      expect(User.create({ ...buildParams(), user: 'UMonitor' }).toValue().user).toBe('umonitor')
    })

    it('debería derivar el hashId del usuario y el host', () => {
      const user = User.create(buildParams())

      expect(user.toValue().hashId.getValue).toBe(UserHashId.generate('uMonitor', 'SQLSERVER01'))
    })

    it('debería conservar host y aliasHost tal como llegan', () => {
      const value = User.create(buildParams()).toValue()

      expect(value.host).toBe('SQLSERVER01')
      expect(value.aliasHost).toBe('SERVIDOR-ALIAS')
    })

    it('debería respetar el rol provisto', () => {
      const user = User.create({ ...buildParams(), role: UserRoleList.ADMIN })

      expect(user.toValue().role).toBe(UserRoleList.ADMIN)
    })

    it('debería respetar la vigencia provista en false', () => {
      const user = User.create({ ...buildParams(), isActive: false })

      expect(user.toValue().isActive).toBe(false)
    })

    it('debería conservar el identificador cuando se provee', () => {
      expect(User.create({ ...buildParams(), id: 42 }).idValue).toBe(42)
    })

    it('debería generar la fecha de registro cuando no se provee', () => {
      const { createdAt, ...sinFecha } = buildParams()
      void createdAt

      const value = User.create(sinFecha).toValue()

      expect(typeof value.createdAt).toBe('string')
      expect(Number.isNaN(new Date(value.createdAt).getTime())).toBe(false)
    })

    it('debería aceptar un createdAt como Date', () => {
      const fecha = new Date(CREATED_AT)

      expect(User.create({ ...buildParams(), createdAt: fecha }).toValue().createdAt).toBe(fecha)
    })

    it('debería validar un hashId provisto contra el usuario y el host', () => {
      const hashAjeno = UserHashId.generate('otroUsuario', 'SQLSERVER01')

      expect(() => User.create({ ...buildParams(), hashId: hashAjeno })).toThrow(/manipulado/)
    })

    it('debería aceptar un hashId provisto que sí corresponde', () => {
      const hash = UserHashId.generate('uMonitor', 'SQLSERVER01')

      expect(User.create({ ...buildParams(), hashId: hash }).toValue().hashId.getValue).toBe(hash)
    })
  })

  describe('persisted', () => {
    it('debería exponer el identificador del usuario persistido', () => {
      expect(User.persisted(buildPersistedParams()).id).toBe(7)
    })
  })
})
