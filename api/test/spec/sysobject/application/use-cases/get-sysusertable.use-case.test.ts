import { BusquedaRecienteInput } from '@busqueda-reciente/domain/schemas/busqueda-reciente'
import { Logger } from '@observability/domain/logger'
import { TIPO_ACCION } from '@sysobject/application/constants/action-type.constant'
import { GetSysUsertableUseCase } from '@sysobject/application/use-cases/get-sysusertable.use-case'
import { RegisterSearchLogUseCase } from '@sysobject/application/use-cases/register-search-log.use-case'
import { SysObjectNotFoundException } from '@sysobject/domain/exceptions/sysobject-not-found.exception'
import { ForLogRepositoryPort, SearchLog } from '@sysobject/domain/ports/drivens/for-log-repository.port'
import { ForProxyBusquedaRecienteRegistrationPort } from '@sysobject/domain/ports/drivens/for-proxy-busqueda-reciente-registration.port'
import { ForSysUsertableRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysusertable-repository.port'
import { LogObjectContext } from '@sysobject/domain/schemas/log-object-context'
import { TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'
import { Column, ExtendedProperty, ForeignKey, Index, UsertableSysObject } from '@sysobject/domain/schemas/usertable'
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

function createFakeSysUsertableRepository(overrides: Partial<ForSysUsertableRepositoryPort> = {}): ForSysUsertableRepositoryPort {
  return {
    getBySchemaAndName: async () => null,
    getColumnsById: async () => [],
    getIndexesById: async () => [],
    getForeignKeysById: async () => [],
    getUsertableExtendedPropertieById: async () => [],
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

const USERTABLE: UsertableSysObject = {
  id: 77,
  name: 'Orders',
  type: TypeSysObjectEnum.USER_TABLE,
  typeDesc: 'USER_TABLE',
  schemaId: 1,
  schemaName: 'dbo',
  createDate: new Date('2025-01-01T00:00:00.000Z'),
  modifyDate: new Date('2025-02-01T00:00:00.000Z'),
}

const EXTENDED_PROPERTIES: ExtendedProperty[] = [{ propertyName: 'MS_Description', propertyValue: 'Órdenes' }]

const COLUMNS: Column[] = [
  { id: 1, name: 'Id', type: 'int', isNullable: false, isIdentity: true, defaultDefinition: null, extendedProperties: [] },
]

const FOREIGN_KEYS: ForeignKey[] = [
  {
    columnId: 2,
    referencedSchema: 'dbo',
    referencedObjectId: 3,
    referencedObject: 'Customers',
    referencedColumnId: 1,
    referencedColumn: 'Id',
  },
]

const INDEXES: Index[] = [
  {
    name: 'PK_Orders',
    typeDesc: 'CLUSTERED',
    isPrimaryKey: true,
    isUnique: true,
    isFiltered: false,
    filterDefinition: null,
    isDisabled: false,
    columns: [{ columnId: 1, columnName: 'Id', keyOrdinal: 1, isDescendingKey: false, isIncludedColumn: false }],
  },
]

const LOG_CONTEXT: LogObjectContext = { idUser: 42, databaseName: 'QualityTools' }

describe('GetSysUsertableUseCase', () => {
  describe('tabla inexistente', () => {
    it('debería lanzar SysObjectNotFoundException sin consultar metadatos ni registrar búsquedas', async () => {
      const detailCalls: string[] = []
      const { repository: logRepository, created } = createFakeLogRepository()
      const registerSearchLog = new RegisterSearchLogUseCase(logRepository, createFakeLogger().logger)
      const { proxy, sent } = createFakeBusquedaRecienteProxy()
      const sysUsertableRepository = createFakeSysUsertableRepository({
        getColumnsById: async () => {
          detailCalls.push('columns')
          return []
        },
        getIndexesById: async () => {
          detailCalls.push('indexes')
          return []
        },
        getForeignKeysById: async () => {
          detailCalls.push('foreignKeys')
          return []
        },
        getUsertableExtendedPropertieById: async () => {
          detailCalls.push('extendedProperties')
          return []
        },
      })
      const useCase = new GetSysUsertableUseCase(sysUsertableRepository, registerSearchLog, proxy, createFakeLogger().logger)

      await expect(useCase.executeBySchemaAndName('dbo', 'Orders', LOG_CONTEXT)).rejects.toBeInstanceOf(SysObjectNotFoundException)
      expect(detailCalls).toHaveLength(0)
      expect(created).toHaveLength(0)
      expect(sent).toHaveLength(0)
    })
  })

  describe('tabla existente', () => {
    it('debería combinar los metadatos por id y registrar log y búsqueda reciente', async () => {
      const requestedIds: number[] = []
      const { repository: logRepository, created } = createFakeLogRepository()
      const registerSearchLog = new RegisterSearchLogUseCase(logRepository, createFakeLogger().logger)
      const { proxy, sent } = createFakeBusquedaRecienteProxy()
      const { logger, infoCalls } = createFakeLogger()
      const track =
        <T>(result: T) =>
        async (id: number) => {
          requestedIds.push(id)
          return result
        }
      const sysUsertableRepository = createFakeSysUsertableRepository({
        getBySchemaAndName: async () => USERTABLE,
        getColumnsById: track(COLUMNS),
        getIndexesById: track(INDEXES),
        getForeignKeysById: track(FOREIGN_KEYS),
        getUsertableExtendedPropertieById: track(EXTENDED_PROPERTIES),
      })
      const useCase = new GetSysUsertableUseCase(sysUsertableRepository, registerSearchLog, proxy, logger)

      const result = await useCase.executeBySchemaAndName(USERTABLE.schemaName, USERTABLE.name, LOG_CONTEXT)

      expect(result).toEqual({
        ...USERTABLE,
        extendedProperties: EXTENDED_PROPERTIES,
        columns: COLUMNS,
        foreignKeys: FOREIGN_KEYS,
        indexes: INDEXES,
      })
      expect(requestedIds).toEqual([USERTABLE.id, USERTABLE.id, USERTABLE.id, USERTABLE.id])

      expect(created).toHaveLength(1)
      expect(created[0].createdAt).toBeInstanceOf(Date)
      expect(created[0]).toMatchObject({
        idUser: LOG_CONTEXT.idUser,
        actionType: TIPO_ACCION.BusquedaRegular,
        database: LOG_CONTEXT.databaseName,
        schema: USERTABLE.schemaName,
        search: USERTABLE.name,
        type: USERTABLE.type,
        isProduction: false,
      })

      expect(sent).toEqual([
        {
          idUser: LOG_CONTEXT.idUser,
          database: LOG_CONTEXT.databaseName,
          schema: USERTABLE.schemaName,
          objectName: USERTABLE.name,
          type: USERTABLE.type,
          dateSearch: created[0].createdAt,
          isActive: true,
        },
      ])
      expect(infoCalls).toHaveLength(1)
    })

    it('debería conservar las colecciones vacías cuando la tabla no tiene metadatos asociados', async () => {
      const { repository: logRepository } = createFakeLogRepository()
      const registerSearchLog = new RegisterSearchLogUseCase(logRepository, createFakeLogger().logger)
      const { proxy } = createFakeBusquedaRecienteProxy()
      const sysUsertableRepository = createFakeSysUsertableRepository({ getBySchemaAndName: async () => USERTABLE })
      const useCase = new GetSysUsertableUseCase(sysUsertableRepository, registerSearchLog, proxy, createFakeLogger().logger)

      const result = await useCase.executeBySchemaAndName(USERTABLE.schemaName, USERTABLE.name, LOG_CONTEXT)

      expect(result).toEqual({
        ...USERTABLE,
        extendedProperties: [],
        columns: [],
        foreignKeys: [],
        indexes: [],
      })
    })
  })
})
