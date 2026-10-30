import { SessionCredentialStore } from '@auth/domain/ports/drivens/session-credential-store.port'
import { CurrentStoreContextResolverAdapter } from '@auth/infrastructure/adapters/drivens/current-store-context-resolver.adapter'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import { UserTypeEnum } from '@core/store/mssql-database-connection'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authContextControl } = vi.hoisted(() => ({
  authContextControl: { get: vi.fn() },
}))

vi.mock('@auth/infrastructure/auth-context', () => ({
  getAuthContext: authContextControl.get,
}))

describe('CurrentStoreContextResolverAdapter', () => {
  const cachedCredentials = {
    host: 'database.local',
    database: 'quality',
    user: 'encrypted-user',
    password: 'encrypted-password',
  }
  const sessionCredentialStore: SessionCredentialStore = {
    save: vi.fn(),
    find: vi.fn(),
    prepareSelectedDatabaseUpdate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    authContextControl.get.mockReturnValue({ userId: 17, sessionId: 'session-42' })
    vi.mocked(sessionCredentialStore.find).mockResolvedValue({
      credentials: {
        ...cachedCredentials,
        user: 'decrypted:encrypted-user',
        password: 'decrypted:encrypted-password',
      },
      type: UserTypeEnum.External,
    })
  })

  it('resuelve el mismo contexto de store con credenciales cacheadas desencriptadas', async () => {
    const resolver = new CurrentStoreContextResolverAdapter(sessionCredentialStore)

    await expect(resolver.resolve()).resolves.toEqual({
      authContext: { userId: 17, sessionId: 'session-42' },
      store: {
        credentials: {
          host: 'database.local',
          database: 'quality',
          user: 'decrypted:encrypted-user',
          password: 'decrypted:encrypted-password',
        },
        type: UserTypeEnum.External,
      },
    })
    expect(sessionCredentialStore.find).toHaveBeenCalledWith(17, 'session-42')
  })

  it('preserva el error cuando no existe contexto de autenticación', async () => {
    authContextControl.get.mockReturnValue(undefined)
    const resolver = new CurrentStoreContextResolverAdapter(sessionCredentialStore)

    await expect(resolver.resolve()).rejects.toThrow('No se pudo recuperar el contexto de autenticación')
    expect(sessionCredentialStore.find).not.toHaveBeenCalled()
  })

  it('preserva el error cuando no existen credenciales cacheadas', async () => {
    vi.mocked(sessionCredentialStore.find).mockResolvedValue(null)
    const resolver = new CurrentStoreContextResolverAdapter(sessionCredentialStore)

    await expect(resolver.resolve()).rejects.toBeInstanceOf(CacheCredentialNotFoundException)
  })
})
