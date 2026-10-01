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
    compareAndSet: vi.fn(),
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
    vi.mocked(cacheRepository.get).mockReset()
    vi.mocked(cacheRepository.compareAndSet).mockReset()
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

    const [key, payload, ttl] = vi.mocked(cacheRepository.set).mock.calls[0]
    expect(key).toBe('auth:credentials:17:plain')
    expect(ttl).toBe(120)
    // La política de texto plano debe persistir cada campo con su valor real, sin reordenar ni intercambiar.
    expect(JSON.parse(payload)).toEqual({
      host: 'database.local',
      database: 'quality',
      user: 'analyst',
      password: 'secret',
    })

    // Ida y vuelta: el descifrador plano devuelve exactamente las credenciales persistidas.
    await expect(store.find(17, 'plain')).resolves.toEqual({
      credentials: { host: 'database.local', database: 'quality', user: 'analyst', password: 'secret' },
      type: UserTypeEnum.External,
    })
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

  it('debería confirmar la base de datos seleccionada contra la pre-imagen y el TTL capturados durante la preparación', async () => {
    const preImage = '{"host":"database.local","database":"quality","user":"encrypted:analyst","password":"encrypted:secret"}'
    vi.mocked(cacheRepository.ttl).mockResolvedValueOnce(87).mockResolvedValueOnce(12)
    vi.mocked(cacheRepository.get).mockResolvedValueOnce(preImage)
    vi.mocked(cacheRepository.compareAndSet).mockResolvedValueOnce(true)
    const store = new CacheSessionCredentialStoreAdapter(cacheRepository, credentialEncryptor, credentialDecryptor, 120)

    const preparedUpdate = await store.prepareSelectedDatabaseUpdate(17, 'session-42')
    const result = await preparedUpdate.commit({ ...credentials, database: 'reporting' })

    expect(result).toEqual({ committed: true })
    expect(cacheRepository.ttl).toHaveBeenCalledWith('auth:credentials:17:session-42')
    expect(cacheRepository.ttl).toHaveBeenCalledTimes(1)
    expect(cacheRepository.get).toHaveBeenCalledWith('auth:credentials:17:session-42')
    expect(cacheRepository.compareAndSet).toHaveBeenCalledWith(
      'auth:credentials:17:session-42',
      preImage,
      '{"host":"database.local","database":"reporting","user":"encrypted:analyst","password":"encrypted:secret"}',
      87,
    )
    expect(cacheRepository.set).not.toHaveBeenCalled()
  })

  it('debería reportar conflicto sin escribir cuando la pre-imagen cambió entre la preparación y la confirmación', async () => {
    vi.mocked(cacheRepository.ttl).mockResolvedValueOnce(87)
    vi.mocked(cacheRepository.get).mockResolvedValueOnce('blob-vigente')
    vi.mocked(cacheRepository.compareAndSet).mockResolvedValueOnce(false)
    const store = new CacheSessionCredentialStoreAdapter(cacheRepository, credentialEncryptor, credentialDecryptor, 120)

    const preparedUpdate = await store.prepareSelectedDatabaseUpdate(17, 'session-42')
    const result = await preparedUpdate.commit({ ...credentials, database: 'reporting' })

    expect(result).toEqual({ committed: false })
    expect(cacheRepository.compareAndSet).toHaveBeenCalledTimes(1)
    expect(cacheRepository.compareAndSet).toHaveBeenCalledWith('auth:credentials:17:session-42', 'blob-vigente', expect.any(String), 87)
    expect(cacheRepository.set).not.toHaveBeenCalled()
  })

  it('debería reportar conflicto cuando la clave ya no existe al preparar, sin escribir ni cifrar', async () => {
    vi.mocked(cacheRepository.ttl).mockResolvedValueOnce(87)
    vi.mocked(cacheRepository.get).mockResolvedValueOnce(null)
    const store = new CacheSessionCredentialStoreAdapter(cacheRepository, credentialEncryptor, credentialDecryptor, 120)

    const preparedUpdate = await store.prepareSelectedDatabaseUpdate(17, 'session-42')
    const result = await preparedUpdate.commit({ ...credentials, database: 'reporting' })

    expect(result).toEqual({ committed: false })
    expect(cacheRepository.compareAndSet).not.toHaveBeenCalled()
    expect(cacheRepository.set).not.toHaveBeenCalled()
    expect(credentialEncryptor.encrypt).not.toHaveBeenCalled()
  })

  it.each([-2, -1, 0])('debería preservar la excepción de ausencia o sin expiración para TTL %i', async ttl => {
    vi.mocked(cacheRepository.ttl).mockResolvedValue(ttl)
    const store = new CacheSessionCredentialStoreAdapter(cacheRepository, credentialEncryptor, credentialDecryptor, 120)

    await expect(store.prepareSelectedDatabaseUpdate(17, 'session-42')).rejects.toBeInstanceOf(CacheCredentialNotFoundException)
    expect(cacheRepository.set).not.toHaveBeenCalled()
    expect(credentialEncryptor.encrypt).not.toHaveBeenCalled()
  })
})
