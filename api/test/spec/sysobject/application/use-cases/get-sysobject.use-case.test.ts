import { BusquedaRecienteInput } from '@busqueda-reciente/domain/schemas/busqueda-reciente'
import { Logger } from '@observability/domain/logger'
import { TIPO_ACCION } from '@sysobject/application/constants/action-type.constant'
import { GetSysObjectUseCase } from '@sysobject/application/use-cases/get-sysobject.use-case'
import { RegisterSearchLogUseCase } from '@sysobject/application/use-cases/register-search-log.use-case'
import { SysObjectNotFoundException } from '@sysobject/domain/exceptions/sysobject-not-found.exception'
import { ForLogRepositoryPort, SearchLog } from '@sysobject/domain/ports/drivens/for-log-repository.port'
import { ForProxyBusquedaRecienteRegistrationPort } from '@sysobject/domain/ports/drivens/for-proxy-busqueda-reciente-registration.port'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { LogObjectContext } from '@sysobject/domain/schemas/log-object-context'
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

function createFakeSysObjectRepository(overrides: Partial<ForSysObjectRepositoryPort> = {}): ForSysObjectRepositoryPort {
  return {
    getBySchemaAndName: async () => null,
    getRolesById: async () => [],
    findByNameAndType: async () => [],
    findDependentsBySchemaAndName: async () => ({ data: [] }),
    findDependenciesBySchemaAndName: async () => ({ data: [] }),
    ...overrides,
  }
}

function createFakeBusquedaRecienteProxy() {
  const sent: BusquedaRecienteInput[] = []

  const proxy: ForProxyBusquedaRecienteRegistrationPort = {
    send: async busquedaReciente => {
      sent.push(busquedaReciente)
    },
  }

  return { proxy, sent }
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

const LOG_CONTEXT: LogObjectContext = { idUser: 42, databaseName: 'QualityTools' }

describe('GetSysObjectUseCase', () => {
  describe('objeto inexistente', () => {
    it('debería lanzar SysObjectNotFoundException y no registrar log ni búsqueda reciente', async () => {
      const { repository: logRepository, created } = createFakeLogRepository()
      const registerSearchLog = new RegisterSearchLogUseCase(logRepository, createFakeLogger().logger)
      const { proxy, sent } = createFakeBusquedaRecienteProxy()
      const useCase = new GetSysObjectUseCase(createFakeSysObjectRepository(), registerSearchLog, proxy, createFakeLogger().logger)

      await expect(useCase.executeBySchemaAndName('dbo', 'vw_orders', LOG_CONTEXT)).rejects.toBeInstanceOf(SysObjectNotFoundException)
      expect(created).toHaveLength(0)
      expect(sent).toHaveLength(0)
    })
  })

  describe('objeto existente', () => {
    it('debería devolver el objeto con sus permisos y registrar log y búsqueda reciente con el mismo timestamp', async () => {
      const requestedIds: number[] = []
      const { repository: logRepository, created } = createFakeLogRepository()
      const registerSearchLog = new RegisterSearchLogUseCase(logRepository, createFakeLogger().logger)
      const { proxy, sent } = createFakeBusquedaRecienteProxy()
      const { logger, infoCalls } = createFakeLogger()
      const sysObjectRepository = createFakeSysObjectRepository({
        getBySchemaAndName: async () => SYS_OBJECT,
        getRolesById: async id => {
          requestedIds.push(id)
          return ROLES
        },
      })
      const useCase = new GetSysObjectUseCase(sysObjectRepository, registerSearchLog, proxy, logger)

      const result = await useCase.executeBySchemaAndName(SYS_OBJECT.schemaName, SYS_OBJECT.name, LOG_CONTEXT)

      expect(result).toEqual({ ...SYS_OBJECT, permission: ROLES })
      expect(requestedIds).toEqual([SYS_OBJECT.id])

      expect(created).toHaveLength(1)
      expect(created[0].createdAt).toBeInstanceOf(Date)
      expect(created[0]).toMatchObject({
        idUser: LOG_CONTEXT.idUser,
        actionType: TIPO_ACCION.BusquedaRegular,
        database: LOG_CONTEXT.databaseName,
        schema: SYS_OBJECT.schemaName,
        search: SYS_OBJECT.name,
        type: SYS_OBJECT.type,
        isProduction: false,
      })

      expect(sent).toEqual([
        {
          idUser: LOG_CONTEXT.idUser,
          database: LOG_CONTEXT.databaseName,
          schema: SYS_OBJECT.schemaName,
          objectName: SYS_OBJECT.name,
          type: SYS_OBJECT.type,
          dateSearch: created[0].createdAt,
          isActive: true,
        },
      ])
      expect(created[0].createdAt).toBe(sent[0].dateSearch)
      expect(infoCalls).toHaveLength(1)
    })
  })
})
