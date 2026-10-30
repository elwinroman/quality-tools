import { SelectedDatabaseConflictException } from '@auth/application/exceptions/selected-database-conflict.exception'
import { SwitchDatabaseUseCase } from '@auth/application/use-cases/switch-database.use-case'
import { ForStoreRepositoryPort } from '@auth/domain/ports/drivens/for-store-repository.port'
import { SessionCredentialStore } from '@auth/domain/ports/drivens/session-credential-store.port'
import { Logger } from '@observability/domain/logger'
import { ApplicationError } from '@shared/application/application-error'
import { StoreUserSchema } from '@shared/domain/store'
import { describe, expect, it, vi } from 'vitest'

// Guarda invertida: si el caso de uso o su grafo de importación toca la
// configuración de entorno, este test falla en vez de levantar el entorno real.
vi.mock('@/config/enviroment', () => {
  throw new Error('SwitchDatabaseUseCase no debe importar @/config/enviroment')
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

function createLogger(): Logger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  }
}

function createSessionCredentialStore(committed: boolean) {
  const commit = vi.fn(async () => ({ committed }))
  const store: SessionCredentialStore = {
    save: vi.fn(async () => undefined),
    find: vi.fn(async () => null),
    prepareSelectedDatabaseUpdate: vi.fn(async () => ({ commit })),
  }

  return { store, commit }
}

function createStoreRepository(): ForStoreRepositoryPort {
  return {
    getDetails: vi.fn(async () => details),
    getPermission: vi.fn(async () => ({ viewdefinitionPermission: true })),
    getDatabases: vi.fn(async () => []),
  }
}

describe('SwitchDatabaseUseCase', () => {
  it('debería devolver los detalles y permisos resueltos cuando el commit confirma el cambio', async () => {
    const logger = createLogger()
    const { store, commit } = createSessionCredentialStore(true)
    const useCase = new SwitchDatabaseUseCase(store, createStoreRepository(), logger)

    await expect(useCase.execute(17, 'session-42', 'requested', credentials)).resolves.toEqual({
      ...details,
      viewdefinitionPermission: true,
    })

    expect(commit).toHaveBeenCalledWith({ ...credentials, database: 'resolved' })
    expect(logger.info).toHaveBeenCalledTimes(1)
  })

  it('debería traducir el conflicto de commit a SelectedDatabaseConflictException de aplicación con status 409', async () => {
    const logger = createLogger()
    const { store } = createSessionCredentialStore(false)
    const useCase = new SwitchDatabaseUseCase(store, createStoreRepository(), logger)

    const execution = useCase.execute(17, 'session-42', 'requested', credentials)

    await expect(execution).rejects.toBeInstanceOf(SelectedDatabaseConflictException)
    await expect(execution).rejects.toBeInstanceOf(ApplicationError)
    await expect(execution).rejects.toMatchObject({
      type: 'SelectedDatabaseConflictException',
      status: 409,
      errorCode: 2002,
    })
    expect(logger.info).not.toHaveBeenCalled()
  })
})
