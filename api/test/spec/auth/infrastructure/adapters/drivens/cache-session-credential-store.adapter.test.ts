import { CacheSessionCredentialStoreAdapter } from '@auth/infrastructure/adapters/drivens/cache-session-credential-store.adapter'
import { KeyValueStore } from '@core/cache/key-value-store'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import { UserTypeEnum } from '@core/store/mssql-database-connection'
import { CredentialDecryptor } from '@shared/domain/credential-decryptor'
import { CredentialEncryptor } from '@shared/domain/credential-encryptor'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('CacheSessionCredentialStoreAdapter', () => {
  const cacheRepository: KeyValueStore = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    ttl: vi.fn(),
    keys: vi.fn(),
  }
  const credentialEncryptor: CredentialEncryptor = { encrypt: vi.fn(value => `encrypted:${value}`) }
  const credentialDecryptor: CredentialDecryptor = { decrypt: vi.fn(value => value.replace('encrypted:', '')) }
  const credentials = {
    host: 'database.local',
    database: 'quality',
    user: 'analyst',
    password: 'secret',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cacheRepository.ttl).mockReset()
  })

  it('debería guardar la clave y el payload compatibles a nivel de bytes con la vida útil de refresh configurada', async () => {
    const store = new CacheSessionCredentialStoreAdapter(cacheRepository, credentialEncryptor, credentialDecryptor, 2_592_000)

    await store.save(17, 'session-42', credentials)

    expect(cacheRepository.set).toHaveBeenCalledWith(
      'auth:credentials:17:session-42',
      '{"host":"database.local","database":"quality","user":"encrypted:analyst","password":"encrypted:secret"}',
      2_592_000,
    )
    expect(credentialEncryptor.encrypt).toHaveBeenNthCalledWith(1, 'analyst')
    expect(credentialEncryptor.encrypt).toHaveBeenNthCalledWith(2, 'secret')
  })

  it('debería soportar la política de texto plano de desarrollo a través de cifradores inyectados', async () => {
    const plainEncryptor: CredentialEncryptor = { encrypt: vi.fn(value => value) }
    const plainDecryptor: CredentialDecryptor = { decrypt: vi.fn(value => value) }
    const store = new CacheSessionCredentialStoreAdapter(cacheRepository, plainEncryptor, plainDecryptor, 120)
    vi.mocked(cacheRepository.get).mockResolvedValue(JSON.stringify(credentials))

    await store.save(17, 'plain', credentials)
    await expect(store.find(17, 'plain')).resolves.toEqual({ credentials, type: UserTypeEnum.External })

    expect(cacheRepository.set).toHaveBeenCalledWith('auth:credentials:17:plain', JSON.stringify(credentials), 120)
    expect(plainEncryptor.encrypt).toHaveBeenCalledTimes(2)
    expect(plainDecryptor.decrypt).toHaveBeenCalledTimes(2)
  })

  it('debería cargar y desencriptar las credenciales de usuario externo a través de dependencias inyectadas', async () => {
    vi.mocked(cacheRepository.get).mockResolvedValue(
      '{"host":"database.local","database":"quality","user":"encrypted:analyst","password":"encrypted:secret"}',
    )
    const store = new CacheSessionCredentialStoreAdapter(cacheRepository, credentialEncryptor, credentialDecryptor, 120)

    await expect(store.find(17, 'session-42')).resolves.toEqual({ credentials, type: UserTypeEnum.External })

    expect(cacheRepository.get).toHaveBeenCalledWith('auth:credentials:17:session-42')
    expect(credentialDecryptor.decrypt).toHaveBeenNthCalledWith(1, 'encrypted:analyst')
    expect(credentialDecryptor.decrypt).toHaveBeenNthCalledWith(2, 'encrypted:secret')
  })

  it('debería devolver null sin desencriptar cuando falta la sesión', async () => {
    vi.mocked(cacheRepository.get).mockResolvedValue(null)
    const store = new CacheSessionCredentialStoreAdapter(cacheRepository, credentialEncryptor, credentialDecryptor, 120)

    await expect(store.find(17, 'missing')).resolves.toBeNull()
    expect(credentialDecryptor.decrypt).not.toHaveBeenCalled()
  })

  it('debería confirmar la base de datos seleccionada con el TTL capturado durante la preparación', async () => {
    vi.mocked(cacheRepository.ttl).mockResolvedValueOnce(87).mockResolvedValueOnce(12)
    const store = new CacheSessionCredentialStoreAdapter(cacheRepository, credentialEncryptor, credentialDecryptor, 120)

    const preparedUpdate = await store.prepareSelectedDatabaseUpdate(17, 'session-42')
    await preparedUpdate.commit({ ...credentials, database: 'reporting' })

    expect(cacheRepository.ttl).toHaveBeenCalledWith('auth:credentials:17:session-42')
    expect(cacheRepository.ttl).toHaveBeenCalledTimes(1)
    expect(cacheRepository.set).toHaveBeenCalledWith(
      'auth:credentials:17:session-42',
      '{"host":"database.local","database":"reporting","user":"encrypted:analyst","password":"encrypted:secret"}',
      87,
    )
  })

  it.each([-2, -1, 0])('debería preservar la excepción de ausencia o sin expiración para TTL %i', async ttl => {
    vi.mocked(cacheRepository.ttl).mockResolvedValue(ttl)
    const store = new CacheSessionCredentialStoreAdapter(cacheRepository, credentialEncryptor, credentialDecryptor, 120)

    await expect(store.prepareSelectedDatabaseUpdate(17, 'session-42')).rejects.toBeInstanceOf(CacheCredentialNotFoundException)
    expect(cacheRepository.set).not.toHaveBeenCalled()
    expect(credentialEncryptor.encrypt).not.toHaveBeenCalled()
  })
})
