import { CacheTokenRevocationStoreAdapter } from '@auth/infrastructure/adapters/drivens/cache-token-revocation-store.adapter'
import { KeyValueStore } from '@core/cache/key-value-store'
import { describe, expect, it, vi } from 'vitest'

function createCacheRepository(overrides: Partial<KeyValueStore> = {}): KeyValueStore {
  return {
    set: vi.fn(async () => undefined),
    get: vi.fn(async () => null),
    delete: vi.fn(async () => undefined),
    ttl: vi.fn(async () => -2),
    keys: vi.fn(async () => []),
    ...overrides,
  }
}

describe('CacheTokenRevocationStoreAdapter', () => {
  it('debería persistir la clave, el marcador y la vida restante compatibles a nivel de bytes a través del gateway inyectado', async () => {
    const cacheRepository = createCacheRepository()
    const store = new CacheTokenRevocationStoreAdapter(cacheRepository)

    await store.revoke({ type: 'access_token', jti: 'access-jti', userId: 42 }, 315)

    expect(cacheRepository.set).toHaveBeenCalledWith('blacklist:access-jti', '{"type":"access_token","jti":"access-jti","user_id":42}', 315)
  })

  it.each([0, -1])('debería reenviar sin cambios una vida restante no positiva de %i', async expiresInSeconds => {
    const cacheRepository = createCacheRepository()
    const store = new CacheTokenRevocationStoreAdapter(cacheRepository)

    await store.revoke({ type: 'refresh_token', jti: 'refresh-jti', userId: 42 }, expiresInSeconds)

    expect(cacheRepository.set).toHaveBeenCalledWith(
      'blacklist:refresh-jti',
      '{"type":"refresh_token","jti":"refresh-jti","user_id":42}',
      expiresInSeconds,
    )
  })

  it.each([
    { cached: '{"legacy":"marker"}', expected: true },
    { cached: '', expected: true },
    { cached: null, expected: false },
  ])('debería interpretar $cached como revocado=$expected', async ({ cached, expected }) => {
    const cacheRepository = createCacheRepository({ get: vi.fn(async () => cached) })
    const store = new CacheTokenRevocationStoreAdapter(cacheRepository)

    await expect(store.isRevoked('token-jti')).resolves.toBe(expected)
    expect(cacheRepository.get).toHaveBeenCalledWith('blacklist:token-jti')
  })
})
