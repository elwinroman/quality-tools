import { RegisterFavoritoUseCase } from '@favorito/application/use-cases/register-favorito.use-case'
import { ForFavoritoRepositoryPort } from '@favorito/domain/ports/drivens/for-favorito-repository.port'
import { FavoritoInput, FavoritoRepoInput, FavoritoRepoResponse } from '@favorito/domain/schemas/favorito'
import { Logger } from '@observability/domain/logger'
import { TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'
import { describe, expect, it } from 'vitest'

interface LogEntry {
  level: 'info' | 'warn'
  message: string
  context?: Record<string, unknown>
}

function createFakeLogger() {
  const calls: LogEntry[] = []

  const logger: Logger = {
    debug: () => undefined,
    info: (message, context) => {
      calls.push({ level: 'info', message, context })
    },
    warn: (message, context) => {
      calls.push({ level: 'warn', message, context })
    },
    error: () => undefined,
    fatal: () => undefined,
  }

  return { logger, calls }
}

function createFakeRepository(overrides: Partial<ForFavoritoRepositoryPort> = {}): ForFavoritoRepositoryPort {
  return {
    createOrUpdate: async () => null,
    findMany: async () => ({ data: [], meta: { limit: 0, total: 0 } }),
    getById: async () => null,
    ...overrides,
  }
}

const FAVORITO_INPUT: FavoritoInput = {
  idUser: 7,
  schema: 'dbo',
  objectName: 'vw_orders',
  type: TypeSysObjectEnum.VIEW,
  isActive: true,
}

const REPOSITORY_RESPONSE: FavoritoRepoResponse = {
  id: 101,
  schema: FAVORITO_INPUT.schema,
  objectName: FAVORITO_INPUT.objectName,
  type: FAVORITO_INPUT.type,
  date: new Date('2026-01-01T00:00:00.000Z'),
  isActive: true,
}

describe('RegisterFavoritoUseCase', () => {
  describe('marcar como favorito', () => {
    it('debería persistir con fecha e isActive y devolver el mensaje de alta', async () => {
      const persisted: FavoritoRepoInput[] = []
      const repository = createFakeRepository({
        createOrUpdate: async input => {
          persisted.push(input)
          return { data: REPOSITORY_RESPONSE }
        },
      })
      const { logger, calls } = createFakeLogger()
      const useCase = new RegisterFavoritoUseCase(repository, logger)

      const result = await useCase.execute(FAVORITO_INPUT)

      expect(persisted).toHaveLength(1)
      expect(persisted[0]).toMatchObject({ ...FAVORITO_INPUT, isActive: true })
      expect(persisted[0].date).toBeInstanceOf(Date)
      expect(result).toEqual({
        data: REPOSITORY_RESPONSE,
        message: `Favorito 'dbo.vw_orders' agregado.`,
      })
      expect(calls).toHaveLength(1)
      expect(calls[0].level).toBe('info')
    })
  })

  describe('desmarcar un favorito existente', () => {
    it('debería persistir isActive false y devolver el mensaje de baja sin lanzar', async () => {
      const persisted: FavoritoRepoInput[] = []
      const desmarcado: FavoritoRepoResponse = {
        ...REPOSITORY_RESPONSE,
        isActive: false,
      }
      const repository = createFakeRepository({
        createOrUpdate: async input => {
          persisted.push(input)
          return { data: desmarcado }
        },
      })
      const { logger, calls } = createFakeLogger()
      const useCase = new RegisterFavoritoUseCase(repository, logger)

      const result = await useCase.execute({
        ...FAVORITO_INPUT,
        isActive: false,
      })

      expect(persisted[0].isActive).toBe(false)
      expect(result).toEqual({
        data: desmarcado,
        message: `Favorito 'dbo.vw_orders' quitado.`,
      })
      expect(calls).toHaveLength(1)
      expect(calls[0].level).toBe('info')
    })
  })

  describe('desmarcar un favorito que no existe', () => {
    it('debería resolver sin escribir nada y sin loguear como alta', async () => {
      const repository = createFakeRepository({
        createOrUpdate: async () => null,
      })
      const { logger, calls } = createFakeLogger()
      const useCase = new RegisterFavoritoUseCase(repository, logger)

      const result = await useCase.execute({
        ...FAVORITO_INPUT,
        isActive: false,
      })

      expect(result).toEqual({
        data: null,
        message: `El favorito 'dbo.vw_orders' ya estaba quitado.`,
      })
      expect(calls).toHaveLength(1)
      expect(calls[0].level).toBe('warn')
    })
  })

  describe('fallo de persistencia', () => {
    it('debería lanzar cuando no se pudo marcar el favorito', async () => {
      const repository = createFakeRepository({
        createOrUpdate: async () => null,
      })
      const useCase = new RegisterFavoritoUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(FAVORITO_INPUT)).rejects.toThrow('Error al insertar o updatear un favorito')
    })
  })
})
