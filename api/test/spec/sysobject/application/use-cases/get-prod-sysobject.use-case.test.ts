import { Logger } from '@observability/domain/logger'
import { TIPO_ACCION } from '@sysobject/application/constants/action-type.constant'
import { GetProdSysObjectUseCase } from '@sysobject/application/use-cases/get-prod-sysobject.use-case'
import { RegisterSearchLogUseCase } from '@sysobject/application/use-cases/register-search-log.use-case'
import { ProdSysObjectNotFoundException } from '@sysobject/domain/exceptions/prod-sysobject-not-found.exception'
import { ForLogRepositoryPort, SearchLog } from '@sysobject/domain/ports/drivens/for-log-repository.port'
import { ForProdSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-prod-sysobject-repository.port'
import { LogProdObjectContext } from '@sysobject/domain/schemas/log-object-context'
import { PermissionRol } from '@sysobject/domain/schemas/permission-rol'
import { SysObject, TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'
import { describe, expect, it } from 'vitest'

interface LogEntry {
  message: string
  context?: Record<string, unknown>
}

function createFakeLogger() {
  const infoCalls: LogEntry[] = []

  const logger: Logger = {
    debug: () => undefined,
    info: (message, context) => {
      infoCalls.push({ message, context })
    },
    warn: () => undefined,
    error: () => undefined,
    fatal: () => undefined,
  }

  return { logger, infoCalls }
}

function createFakeProdSysObjectRepository(overrides: Partial<ForProdSysObjectRepositoryPort> = {}): ForProdSysObjectRepositoryPort {
  return {
    getByNameAndSchema: async () => null,
    getRolesById: async () => [],
    ...overrides,
  }
}

function createFakeLogRepository() {
  const created: SearchLog[] = []

  const repository: ForLogRepositoryPort = {
    createSearchLog: async searchLog => {
      created.push(searchLog)
      return true
    },
  }

  return { repository, created }
}

const SYS_OBJECT: SysObject = {
  id: 501,
  name: 'vw_orders',
  type: TypeSysObjectEnum.VIEW,
  typeDesc: 'VIEW',
  schemaId: 1,
  schemaName: 'dbo',
  createDate: new Date('2025-01-01T00:00:00.000Z'),
  modifyDate: new Date('2025-02-01T00:00:00.000Z'),
  definition: 'CREATE VIEW dbo.vw_orders AS SELECT 1',
}

const ROLES: PermissionRol[] = [{ stateDesc: 'GRANT', permissionName: 'SELECT', name: 'analista' }]

function buildUseCase(
  repository: ForProdSysObjectRepositoryPort,
  logRepository: ForLogRepositoryPort,
  logger: Logger,
): GetProdSysObjectUseCase {
  return new GetProdSysObjectUseCase(repository, new RegisterSearchLogUseCase(logRepository, createFakeLogger().logger), logger)
}

describe('GetProdSysObjectUseCase', () => {
  describe('objeto inexistente en producción', () => {
    it('debería lanzar ProdSysObjectNotFoundException y no registrar log', async () => {
      const { repository: logRepository, created } = createFakeLogRepository()
      const useCase = buildUseCase(createFakeProdSysObjectRepository(), logRepository, createFakeLogger().logger)

      await expect(
        useCase.execute(SYS_OBJECT.name, SYS_OBJECT.schemaName, TIPO_ACCION.Comparacion, { idUser: 42, databaseName: 'ProdDB' }),
      ).rejects.toBeInstanceOf(ProdSysObjectNotFoundException)
      expect(created).toHaveLength(0)
    })
  })

  describe('objeto existente en producción', () => {
    it('debería devolver el objeto con permisos y registrar el log con el actionType recibido', async () => {
      const { repository: logRepository, created } = createFakeLogRepository()
      const { logger, infoCalls } = createFakeLogger()
      const context: LogProdObjectContext = { idUser: 42, databaseName: 'ProdDB' }
      const useCase = buildUseCase(
        createFakeProdSysObjectRepository({ getByNameAndSchema: async () => SYS_OBJECT, getRolesById: async () => ROLES }),
        logRepository,
        logger,
      )

      const result = await useCase.execute(SYS_OBJECT.name, SYS_OBJECT.schemaName, TIPO_ACCION.Comparacion, context)

      expect(result).toEqual({ ...SYS_OBJECT, permission: ROLES })
      expect(created).toHaveLength(1)
      expect(created[0].createdAt).toBeInstanceOf(Date)
      expect(created[0]).toMatchObject({
        idUser: context.idUser,
        actionType: TIPO_ACCION.Comparacion,
        database: context.databaseName,
        schema: SYS_OBJECT.schemaName,
        search: SYS_OBJECT.name,
        type: SYS_OBJECT.type,
        isProduction: true,
      })
      expect(infoCalls).toHaveLength(1)
      expect(infoCalls[0].context).toMatchObject({ actionDetails: { isAnonymous: false, rolesCount: ROLES.length } })
    })

    it('debería registrar el log como anónimo cuando el idUser es null', async () => {
      const { repository: logRepository, created } = createFakeLogRepository()
      const { logger, infoCalls } = createFakeLogger()
      const context: LogProdObjectContext = { idUser: null, databaseName: 'ProdDB' }
      const useCase = buildUseCase(
        createFakeProdSysObjectRepository({ getByNameAndSchema: async () => SYS_OBJECT, getRolesById: async () => ROLES }),
        logRepository,
        logger,
      )

      await useCase.execute(SYS_OBJECT.name, SYS_OBJECT.schemaName, TIPO_ACCION.BusquedaRegular, context)

      expect(created).toHaveLength(1)
      expect(created[0].idUser).toBeNull()
      expect(infoCalls[0].context).toMatchObject({ actionDetails: { isAnonymous: true } })
    })
  })
})
