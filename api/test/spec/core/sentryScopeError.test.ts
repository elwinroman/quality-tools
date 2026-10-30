import {
  enrichErrorStackWithCallsite,
  SENTRY_DATABASE_OPERATION_CONTEXT,
  SENTRY_ORIGINAL_STACK_MARKER,
  SENTRY_STATEMENT_MAX_LENGTH,
  SENTRY_STATEMENT_TRUNCATION_MARKER,
  sentryScopeError,
} from '@core/sentry/sentryScopeError'
import { LoggerRequestContext, requestLogContextStorage } from '@observability/infrastructure/context/request-log-context.storage'
import sql from 'mssql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sentryControl } = vi.hoisted(() => ({
  sentryControl: {
    captureException: vi.fn(),
    withScope: vi.fn(),
    setContext: vi.fn(),
  },
}))

vi.mock('@sentry/node', () => {
  const scope = {
    addEventProcessor: vi.fn(),
    setTag: vi.fn(),
    setTransactionName: vi.fn(),
    setUser: vi.fn(),
    setContext: sentryControl.setContext,
    setExtra: vi.fn(),
  }

  return {
    withScope: (callback: (scope: unknown) => void) => {
      sentryControl.withScope()
      callback(scope)
    },
    captureException: sentryControl.captureException,
  }
})

vi.mock('@/config/enviroment', () => ({ SENTRY_REPORTING_ENABLED: true }))

/** Contexto mínimo de request con los campos que lee `sentryScopeError`. */
function crearContextoDeRequest(): LoggerRequestContext {
  return {
    correlationId: 'test-correlation',
    source: { method: 'GET', url: '/list-databases', userAgent: 'vitest', ip: '127.0.0.1' },
    auth: { status: 'authenticated' },
    request: { headers: {} } as unknown as LoggerRequestContext['request'],
  }
}

describe('enrichErrorStackWithCallsite', () => {
  it('antepone el punto de llamada de la aplicación y conserva el stack original del driver', () => {
    const error = new Error('Sintaxis SQL inválida')
    error.name = 'RequestError'
    error.stack = 'RequestError: Sintaxis SQL inválida\n    at driverRequest (node_modules/mssql/request.js:1:1)'
    const stackPuntoLlamada = [
      '    at MssqlStoreRepositoryAdapter.getDatabases (mssql-store-repository.adapter.ts:90:31)',
      '    at ListDatabasesUseCase.execute (list-databases.use-case.ts:13:53)',
    ].join('\n')

    enrichErrorStackWithCallsite(error, stackPuntoLlamada)

    expect(error.stack).toBe(
      [
        'RequestError: Sintaxis SQL inválida',
        stackPuntoLlamada,
        SENTRY_ORIGINAL_STACK_MARKER,
        'RequestError: Sintaxis SQL inválida\n    at driverRequest (node_modules/mssql/request.js:1:1)',
      ].join('\n'),
    )
  })

  it('descarta la línea de encabezado sintética que agrega Error.captureStackTrace', () => {
    const error = new Error('Sintaxis SQL inválida')
    error.name = 'RequestError'
    error.stack = 'RequestError: Sintaxis SQL inválida\n    at driverRequest (node_modules/mssql/request.js:1:1)'
    const stackConEncabezado = [
      'Error: ',
      '    at MssqlStoreRepositoryAdapter.getDatabases (mssql-store-repository.adapter.ts:90:31)',
    ].join('\n')

    enrichErrorStackWithCallsite(error, stackConEncabezado)

    expect(error.stack).not.toContain('Error: \n')
    expect(error.stack).toContain('    at MssqlStoreRepositoryAdapter.getDatabases')
  })

  it('conserva el stack original cuando no hay punto de llamada', () => {
    const error = new Error('sin punto de llamada')
    const stackOriginal = error.stack

    enrichErrorStackWithCallsite(error, undefined)

    expect(error.stack).toContain(SENTRY_ORIGINAL_STACK_MARKER)
    expect(error.stack).toContain(stackOriginal)
  })
})

describe('sentryScopeError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reporta la misma instancia cruda, sin proxy, y enriquece su stack desde el contexto', () => {
    const error = new sql.RequestError('fallo de base de datos', 'EREQUEST')
    const contexto = crearContextoDeRequest()
    contexto.databaseOperationCallsite = {
      operation: 'query',
      stack: '    at MssqlStoreRepositoryAdapter.getDatabases (mssql-store-repository.adapter.ts:90:31)',
      statement: 'SELECT name FROM sys.databases',
    }

    requestLogContextStorage.run(contexto, () => sentryScopeError(error))

    expect(sentryControl.captureException).toHaveBeenCalledWith(error)
    expect(error.stack).toContain('MssqlStoreRepositoryAdapter.getDatabases')
    expect(error.stack).toContain(SENTRY_ORIGINAL_STACK_MARKER)
  })

  it('reporta el error crudo aunque no haya punto de llamada registrado', () => {
    const error = new sql.ConnectionError('conexión cerrada', 'ECONNCLOSED')
    const contexto = crearContextoDeRequest()

    requestLogContextStorage.run(contexto, () => sentryScopeError(error))

    expect(sentryControl.captureException).toHaveBeenCalledWith(error)
  })

  it('adjunta el statement como contexto, truncado y marcado, sin credenciales ni parámetros', () => {
    const statementLargo = `SELECT '${'x'.repeat(SENTRY_STATEMENT_MAX_LENGTH + 200)}'`
    const error = new sql.RequestError('fallo de base de datos', 'EREQUEST')
    const contexto = crearContextoDeRequest()
    contexto.databaseOperationCallsite = { operation: 'query', statement: statementLargo }

    requestLogContextStorage.run(contexto, () => sentryScopeError(error))

    const llamada = sentryControl.setContext.mock.calls.find(([nombre]) => nombre === SENTRY_DATABASE_OPERATION_CONTEXT)
    expect(llamada).toBeDefined()

    const payload = llamada?.[1] as { operation: string; statement: string }
    expect(payload.operation).toBe('query')
    expect(payload.statement).toContain(SENTRY_STATEMENT_TRUNCATION_MARKER)
    expect(payload.statement.length).toBe(SENTRY_STATEMENT_MAX_LENGTH + SENTRY_STATEMENT_TRUNCATION_MARKER.length)
    expect(payload.statement).not.toContain('password')
    expect(payload.statement).not.toContain('host')

    // el statement nunca viaja en el mensaje del error
    expect(error.message).toBe('fallo de base de datos')
  })

  it('envía un statement corto sin marca de truncado', () => {
    const error = new sql.RequestError('fallo de base de datos', 'EREQUEST')
    const contexto = crearContextoDeRequest()
    contexto.databaseOperationCallsite = { operation: 'execute', statement: 'dbo.Procedimiento' }

    requestLogContextStorage.run(contexto, () => sentryScopeError(error))

    const llamada = sentryControl.setContext.mock.calls.find(([nombre]) => nombre === SENTRY_DATABASE_OPERATION_CONTEXT)
    expect(llamada?.[1]).toEqual({ operation: 'execute', statement: 'dbo.Procedimiento' })
    expect(JSON.stringify(llamada?.[1])).not.toContain(SENTRY_STATEMENT_TRUNCATION_MARKER)
  })
})
