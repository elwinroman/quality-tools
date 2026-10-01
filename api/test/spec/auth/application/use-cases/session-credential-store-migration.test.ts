import { LoginUseCase } from '@auth/application/use-cases/login.use-case'
import { RefreshTokenUseCase } from '@auth/application/use-cases/refresh-token.use-case'
import { SwitchDatabaseUseCase } from '@auth/application/use-cases/switch-database.use-case'
import { ForStoreRepositoryPort } from '@auth/domain/ports/drivens/for-store-repository.port'
import { ForTokenManagementPort, RefreshTokenDecoded } from '@auth/domain/ports/drivens/for-token-management.port'
import { ForUserRepositoryPort } from '@auth/domain/ports/drivens/for-user-repository.port'
import { SessionCredentialStore } from '@auth/domain/ports/drivens/session-credential-store.port'
import { TokenRevocationStore } from '@auth/domain/ports/drivens/token-revocation-store.port'
import { User } from '@auth/domain/schemas/user'
import { UserHashId } from '@auth/domain/value-objects/user-hash-id'
import { CacheSessionCredentialStoreAdapter } from '@auth/infrastructure/adapters/drivens/cache-session-credential-store.adapter'
import { KeyValueStore } from '@core/cache/key-value-store'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import { UserTypeEnum } from '@core/store/mssql-database-connection'
import { Logger } from '@observability/domain/logger'
import { LoggerContext } from '@observability/domain/logger-context'
import { ForbiddenException } from '@shared/application/exceptions'
import { CredentialDecryptor } from '@shared/domain/credential-decryptor'
import { CredentialEncryptor } from '@shared/domain/credential-encryptor'
import { StoreUserSchema } from '@shared/domain/store'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config/enviroment', () => {
  throw new Error('Auth application use cases must not import environment configuration')
})

const credentials: StoreUserSchema = {
  host: 'database.local',
  database: 'requested',
  user: 'analyst',
  password: 'secret',
}

const details = {
  name: 'resolved',
  compatibility: 160,
  description: null,
  server: 'database.local',
  prodDatabase: 'production',
}

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
}

const loggerContext: LoggerContext = { set: vi.fn() }

function createSessionStore(overrides: Partial<SessionCredentialStore> = {}): SessionCredentialStore {
  return {
    save: vi.fn(async () => undefined),
    find: vi.fn(async () => null),
    prepareSelectedDatabaseUpdate: vi.fn(async () => ({ commit: vi.fn(async () => ({ committed: true })) })),
    ...overrides,
  }
}

function createStoreRepository(): ForStoreRepositoryPort {
  return {
    getDetails: vi.fn(async () => details),
    getPermission: vi.fn(async () => ({ viewdefinitionPermission: true })),
    getDatabases: vi.fn(async () => []),
  }
}

function createTokenManager(refreshDecoded?: RefreshTokenDecoded): ForTokenManagementPort {
  return {
    createAccessToken: vi.fn(() => 'access-token'),
    createRefreshToken: vi.fn(() => 'refresh-token'),
    verifyAccessToken: vi.fn(() => {
      throw new Error('not used')
    }),
    verifyRefreshToken: vi.fn(() => {
      if (!refreshDecoded) throw new Error('not used')
      return refreshDecoded
    }),
    checkIfUserIsAlreadyAuthenticated: vi.fn(() => false),
  }
}

describe('migración de casos de uso al almacén de credenciales de sesión', () => {
  it('debería guardar en login las credenciales resueltas a través del almacén semántico', async () => {
    const sessionCredentialStore = createSessionStore()
    const userRepository: ForUserRepositoryPort = {
      getOrCreate: vi.fn(async () =>
        User.persisted({
          id: 17,
          hashId: UserHashId.generate('analyst', 'database.local'),
          user: 'analyst',
          host: 'database.local',
          aliasHost: 'database.local',
        }),
      ),
      getById: vi.fn(async () => null),
    }
    const useCase = new LoginUseCase(userRepository, createStoreRepository(), sessionCredentialStore, createTokenManager(), logger)

    await useCase.execute(credentials)

    expect(sessionCredentialStore.save).toHaveBeenCalledWith(17, expect.any(String), { ...credentials, database: 'resolved' })
  })

  it('debería usar en refresh los almacenes semánticos y revocar el token durante su vida restante cuando no hay credenciales', async () => {
    const decoded: RefreshTokenDecoded = {
      user_id: 17,
      username: 'analyst',
      session_id: 'session-42',
      type: 'refresh_token',
      jti: 'refresh-jti',
      expirationCountdown: 600,
    }
    const sessionCredentialStore = createSessionStore()
    const tokenRevocationStore: TokenRevocationStore = {
      isRevoked: vi.fn(async () => false),
      revoke: vi.fn(async () => undefined),
    }
    const tokenManager = createTokenManager(decoded)
    const useCase = new RefreshTokenUseCase(tokenManager, tokenRevocationStore, logger, loggerContext, sessionCredentialStore)

    await expect(useCase.execute('refresh-token')).rejects.toBeInstanceOf(CacheCredentialNotFoundException)

    expect(tokenManager.verifyRefreshToken).toHaveBeenCalledWith('refresh-token')
    expect(sessionCredentialStore.find).toHaveBeenCalledWith(17, 'session-42')
    expect(tokenRevocationStore.revoke).toHaveBeenCalledWith({ type: 'refresh_token', jti: 'refresh-jti', userId: 17 }, 600)
  })

  it('debería crear un nuevo token de acceso en refresh tras una consulta exitosa de credenciales', async () => {
    const decoded: RefreshTokenDecoded = {
      user_id: 17,
      username: 'analyst',
      session_id: 'session-42',
      type: 'refresh_token',
      jti: 'refresh-jti',
      expirationCountdown: 600,
    }
    const sessionCredentialStore = createSessionStore({
      find: vi.fn(async () => ({ credentials, type: UserTypeEnum.External })),
    })
    const tokenRevocationStore: TokenRevocationStore = {
      isRevoked: vi.fn(async () => false),
      revoke: vi.fn(async () => undefined),
    }
    const tokenManager = createTokenManager(decoded)
    const useCase = new RefreshTokenUseCase(tokenManager, tokenRevocationStore, logger, loggerContext, sessionCredentialStore)

    await expect(useCase.execute('refresh-token')).resolves.toEqual({ accessToken: 'access-token' })

    expect(sessionCredentialStore.find).toHaveBeenCalledWith(17, 'session-42')
    expect(tokenManager.createAccessToken).toHaveBeenCalledWith(17, 'analyst', 'session-42')
    expect(tokenRevocationStore.revoke).not.toHaveBeenCalled()
  })

  it('debería rechazar en refresh un token revocado antes de consultar las credenciales de sesión', async () => {
    const decoded: RefreshTokenDecoded = {
      user_id: 17,
      username: 'analyst',
      session_id: 'session-42',
      type: 'refresh_token',
      jti: 'refresh-jti',
      expirationCountdown: 600,
    }
    const sessionCredentialStore = createSessionStore()
    const tokenRevocationStore: TokenRevocationStore = {
      isRevoked: vi.fn(async () => true),
      revoke: vi.fn(async () => undefined),
    }
    const useCase = new RefreshTokenUseCase(
      createTokenManager(decoded),
      tokenRevocationStore,
      logger,
      loggerContext,
      sessionCredentialStore,
    )

    await expect(useCase.execute('refresh-token')).rejects.toBeInstanceOf(ForbiddenException)

    expect(tokenRevocationStore.isRevoked).toHaveBeenCalledWith('refresh-jti')
    expect(sessionCredentialStore.find).not.toHaveBeenCalled()
    expect(tokenRevocationStore.revoke).not.toHaveBeenCalled()
  })

  it('debería propagar en refresh el fallo de revocación en lugar de reemplazarlo por CacheCredentialNotFoundException', async () => {
    const revocationFailure = new Error('revocation failed')
    const decoded: RefreshTokenDecoded = {
      user_id: 17,
      username: 'analyst',
      session_id: 'session-42',
      type: 'refresh_token',
      jti: 'refresh-jti',
      expirationCountdown: 600,
    }
    const tokenRevocationStore: TokenRevocationStore = {
      isRevoked: vi.fn(async () => false),
      revoke: vi.fn(async () => {
        throw revocationFailure
      }),
    }
    const useCase = new RefreshTokenUseCase(createTokenManager(decoded), tokenRevocationStore, logger, loggerContext, createSessionStore())

    await expect(useCase.execute('refresh-token')).rejects.toBe(revocationFailure)
  })

  it.each([-2, -1, 0])('debería rechazar en switch-database TTL %i antes de llamar al repositorio de store', async ttl => {
    const cacheRepository: KeyValueStore = {
      set: vi.fn(async () => undefined),
      compareAndSet: vi.fn(async () => false),
      get: vi.fn(async () => null),
      delete: vi.fn(async () => undefined),
      ttl: vi.fn(async () => ttl),
      keys: vi.fn(async () => []),
    }
    const encryptor: CredentialEncryptor = { encrypt: vi.fn(value => value) }
    const decryptor: CredentialDecryptor = { decrypt: vi.fn(value => value) }
    const sessionCredentialStore = new CacheSessionCredentialStoreAdapter(cacheRepository, encryptor, decryptor, 120)
    const storeRepository = createStoreRepository()
    const useCase = new SwitchDatabaseUseCase(sessionCredentialStore, storeRepository, logger)

    await expect(useCase.execute(17, 'session-42', 'requested-target', credentials)).rejects.toBeInstanceOf(
      CacheCredentialNotFoundException,
    )

    expect(storeRepository.getDetails).not.toHaveBeenCalled()
    expect(storeRepository.getPermission).not.toHaveBeenCalled()
    expect(cacheRepository.set).not.toHaveBeenCalled()
  })

  it('debería preparar en switch-database antes de la validación y confirmar la base de datos resuelta', async () => {
    const commit = vi.fn(async () => ({ committed: true }))
    const prepare = vi.fn(async () => ({ commit }))
    const sessionCredentialStore = createSessionStore({ prepareSelectedDatabaseUpdate: prepare })
    const storeRepository = createStoreRepository()
    const useCase = new SwitchDatabaseUseCase(sessionCredentialStore, storeRepository, logger)

    const result = await useCase.execute(17, 'session-42', 'requested-target', credentials)

    expect(result).toEqual({ ...details, viewdefinitionPermission: true })
    expect(prepare).toHaveBeenCalledWith(17, 'session-42')
    expect(commit).toHaveBeenCalledWith({
      ...credentials,
      database: 'resolved',
    })
    expect(prepare.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(storeRepository.getDetails).mock.invocationCallOrder[0])
    expect(vi.mocked(storeRepository.getPermission).mock.invocationCallOrder[0]).toBeLessThan(commit.mock.invocationCallOrder[0])
  })
})
