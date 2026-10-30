import { InvalidCredentialsException } from '@auth/domain/exceptions/invalid-credentials.exception'
import type { MSSQLConnection } from '@core/store/mssql-connection'
import { UserTypeEnum } from '@core/store/mssql-database-connection'
import { MSSQLQueryRunner, type MSSQLTransactionContext } from '@core/store/mssql-query-runner'
import { LoggerRequestContext, requestLogContextStorage } from '@observability/infrastructure/context/request-log-context.storage'
import type { StoreUserSchema } from '@shared/domain/store'
import sql from 'mssql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { transactionControl } = vi.hoisted(() => ({
  transactionControl: {
    constructTransaction: vi.fn(),
    constructRequest: vi.fn(),
    begin: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    request: { input: vi.fn(), query: vi.fn(), execute: vi.fn() },
  },
}))

vi.mock('@observability/infrastructure/logging/logger-instance', () => ({
  logger: { error: vi.fn() },
}))

vi.mock('mssql', async importOriginal => {
  const actual = await importOriginal<typeof import('mssql')>()
  const interop = actual as typeof actual & { default?: Record<string, unknown> }
  const actualExports = (interop.default ?? actual) as unknown as Record<string, unknown>

  class TransactionMock {
    begin = transactionControl.begin
    commit = transactionControl.commit
    rollback = transactionControl.rollback

    constructor(pool: unknown) {
      transactionControl.constructTransaction(pool)
    }
  }

  const RequestMock = vi.fn((transaction: unknown) => {
    transactionControl.constructRequest(transaction)
    return transactionControl.request
  })

  return {
    ...actual,
    default: { ...actualExports, Transaction: TransactionMock, Request: RequestMock },
    Transaction: TransactionMock,
    Request: RequestMock,
  }
})

const credentials: StoreUserSchema = { host: 'host', database: 'database', user: 'user', password: 'password' }
const VALOR_PARAMETRO_SENSIBLE = 424242
const request = { input: vi.fn(), query: vi.fn(), execute: vi.fn() }
const pool = { request: vi.fn(() => request) }
const connect = vi.fn()
const connection: MSSQLConnection = { connect }

function expectCallOrder(...callOrder: number[]): void {
  expect(callOrder).toEqual([...callOrder].sort((left, right) => left - right))
}

/** Contexto AsyncLocalStorage mínimo: el ejecutor sólo necesita el store activo. */
function crearContextoDeRequest(): LoggerRequestContext {
  return {
    correlationId: 'test-correlation',
    source: { method: 'GET', url: '/test', userAgent: 'vitest', ip: '127.0.0.1' },
    auth: { status: 'authenticated' },
    request: {} as LoggerRequestContext['request'],
  }
}

/**
 * Helper NOMBRADO que imita un método de repositorio: aquí vive el punto de llamada real.
 * El frame capturado debe ser ESTE, no un método del ejecutor ni un `new Error()`.
 */
async function consultarDesdeRepositorio(runner: MSSQLQueryRunner, statement: string): Promise<unknown> {
  const res = await runner.query({ credentials, userType: UserTypeEnum.Internal, statement })
  return res.recordset
}

/** Helper NOMBRADO que imita la operación transaccional de un repositorio. */
async function operarDentroDeLaTransaccion(context: MSSQLTransactionContext): Promise<void> {
  await context.query({ statement: 'SELECT 1' })
}

/**
 * Helper NOMBRADO que imita un repositorio que envía credenciales y un valor de parámetro:
 * ninguno de los dos debe terminar en el contexto de diagnóstico.
 */
async function consultarConParametrosDesdeRepositorio(runner: MSSQLQueryRunner): Promise<unknown> {
  const res = await runner.query({
    credentials,
    userType: UserTypeEnum.Internal,
    statement: 'SELECT * FROM sys.objects WHERE object_id = @id',
    parameters: [{ name: 'id', type: sql.Int, value: VALOR_PARAMETRO_SENSIBLE }],
  })
  return res.recordset
}

describe('MSSQLQueryRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    connect.mockResolvedValue(pool)
    request.input.mockReturnValue(request)
    transactionControl.request.input.mockReturnValue(transactionControl.request)
    transactionControl.begin.mockResolvedValue(undefined)
    transactionControl.commit.mockResolvedValue(undefined)
    transactionControl.rollback.mockResolvedValue(undefined)
  })

  it('debería enlazar los parámetros declarativos y devolver el resultado crudo de query', async () => {
    const rawResult = { recordset: [{ id: 1 }], recordsets: [[{ id: 1 }]], rowsAffected: [1], output: {} }
    request.query.mockResolvedValue(rawResult)
    const runner = new MSSQLQueryRunner(connection)

    const result = await runner.query({
      credentials,
      userType: UserTypeEnum.Internal,
      statement: 'SELECT @id, @name',
      parameters: [
        { name: 'id', type: sql.Int, value: 1 },
        { name: 'name', type: sql.VarChar(64), value: 'objeto' },
      ],
    })

    expect(result).toBe(rawResult)
    expect(connect).toHaveBeenCalledWith(credentials, UserTypeEnum.Internal)
    expect(request.input).toHaveBeenNthCalledWith(1, 'id', sql.Int, 1)
    expect(request.input).toHaveBeenNthCalledWith(2, 'name', sql.VarChar(64), 'objeto')
    expect(request.query).toHaveBeenCalledWith('SELECT @id, @name')
  })

  it('debería enlazar los parámetros declarativos y devolver el resultado crudo de execute', async () => {
    const rawResult = { recordset: [{ id: 2 }], recordsets: [[{ id: 2 }]], rowsAffected: [1], output: {}, returnValue: 0 }
    request.execute.mockResolvedValue(rawResult)
    const runner = new MSSQLQueryRunner(connection)

    const result = await runner.execute({
      credentials,
      userType: UserTypeEnum.Internal,
      procedure: 'dbo.Procedimiento',
      parameters: [{ name: 'id', type: sql.Int, value: 2 }],
    })

    expect(result).toBe(rawResult)
    expect(request.input).toHaveBeenCalledWith('id', sql.Int, 2)
    expect(request.execute).toHaveBeenCalledWith('dbo.Procedimiento')
  })

  it('debería propagar crudo un error de query de MSSQL, sin envolverlo', async () => {
    const original = Object.assign(new sql.RequestError('consulta rechazada', 'EREQUEST'), { number: 208 })
    request.query.mockRejectedValue(original)
    const runner = new MSSQLQueryRunner(connection)

    const operation = runner.query({ credentials, userType: UserTypeEnum.Internal, statement: 'SELECT 1' })

    await expect(operation).rejects.toBe(original)
    await expect(operation).rejects.toBeInstanceOf(sql.RequestError)
    await expect(operation).rejects.toMatchObject({ code: 'EREQUEST', number: 208 })
  })

  it('debería propagar crudo un error de execute de MSSQL, sin envolverlo', async () => {
    const original = Object.assign(new sql.RequestError('procedimiento rechazado', 'EREQUEST'), { number: 208 })
    request.execute.mockRejectedValue(original)
    const runner = new MSSQLQueryRunner(connection)

    const operation = runner.execute({ credentials, userType: UserTypeEnum.Internal, procedure: 'dbo.Procedimiento' })

    await expect(operation).rejects.toBe(original)
    await expect(operation).rejects.toBeInstanceOf(sql.RequestError)
  })

  it('debería propagar crudo un error desconocido de una operación de base de datos', async () => {
    const original = new Error('fallo desconocido')
    request.query.mockRejectedValue(original)
    const runner = new MSSQLQueryRunner(connection)

    const operation = runner.query({ credentials, userType: UserTypeEnum.Internal, statement: 'SELECT 1' })

    await expect(operation).rejects.toBe(original)
  })

  it('debería propagar InvalidCredentialsException sin envolverla', async () => {
    const original = new InvalidCredentialsException('Credenciales rechazadas.')
    connect.mockRejectedValue(original)
    const runner = new MSSQLQueryRunner(connection)

    const operation = runner.query({ credentials, userType: UserTypeEnum.External, statement: 'SELECT 1' })

    await expect(operation).rejects.toBe(original)
  })

  it('debería capturar como primer frame el repositorio que llama a query y no el ejecutor', async () => {
    const original = new sql.RequestError('consulta rechazada', 'EREQUEST')
    request.query.mockRejectedValue(original)
    const runner = new MSSQLQueryRunner(connection)
    const contexto = crearContextoDeRequest()

    await requestLogContextStorage.run(contexto, async () => {
      await expect(consultarDesdeRepositorio(runner, 'SELECT 1')).rejects.toBe(original)
    })

    const stack = contexto.databaseOperationCallsite?.stack ?? ''
    const primerFrame = stack.split('\n').filter(linea => linea.trim().startsWith('at '))[0] ?? ''

    expect(primerFrame).toContain('consultarDesdeRepositorio')
    expect(primerFrame).not.toContain('MSSQLQueryRunner')
    expect(stack).not.toContain('new Error')
  })

  it('debería limpiar el punto de llamada sólo cuando la consulta termina bien', async () => {
    request.query.mockResolvedValue({ recordset: [] })
    const runner = new MSSQLQueryRunner(connection)
    const contexto = crearContextoDeRequest()
    contexto.databaseOperationCallsite = { operation: 'query', stack: 'punto de llamada previo', statement: 'SELECT 1' }

    await requestLogContextStorage.run(contexto, () => consultarDesdeRepositorio(runner, 'SELECT 1'))

    expect(contexto.databaseOperationCallsite).toBeUndefined()
  })

  it('debería dejar el punto de llamada registrado cuando la consulta falla', async () => {
    const original = new sql.RequestError('consulta rechazada', 'EREQUEST')
    request.query.mockRejectedValue(original)
    const runner = new MSSQLQueryRunner(connection)
    const contexto = crearContextoDeRequest()

    await requestLogContextStorage.run(contexto, async () => {
      await expect(consultarDesdeRepositorio(runner, 'SELECT 1')).rejects.toBe(original)
    })

    expect(contexto.databaseOperationCallsite).toBeDefined()
    expect(contexto.databaseOperationCallsite?.stack).toContain('consultarDesdeRepositorio')
  })

  it('debería registrar etiqueta y statement sin copiar credenciales ni valores de parámetros', async () => {
    const original = new sql.RequestError('consulta rechazada', 'EREQUEST')
    request.query.mockRejectedValue(original)
    const runner = new MSSQLQueryRunner(connection)
    const contexto = crearContextoDeRequest()

    await requestLogContextStorage.run(contexto, async () => {
      await expect(consultarConParametrosDesdeRepositorio(runner)).rejects.toBe(original)
    })

    const operacion = contexto.databaseOperationCallsite
    expect(operacion?.operation).toBe('query')
    expect(operacion?.statement).toBe('SELECT * FROM sys.objects WHERE object_id = @id')
    // lista blanca estricta: no queda lugar para credenciales ni parámetros
    expect(Object.keys(operacion ?? {}).sort()).toEqual(['operation', 'stack', 'statement'])

    const serializado = JSON.stringify(operacion)
    expect(serializado).not.toContain('"user"')
    expect(serializado).not.toContain('"password"')
    expect(serializado).not.toContain('"host"')
    expect(serializado).not.toContain(String(VALOR_PARAMETRO_SENSIBLE))
  })

  it('debería registrar la etiqueta y el statement de una consulta transaccional que falla', async () => {
    const original = new sql.RequestError('trabajo rechazado', 'EREQUEST')
    transactionControl.request.query.mockRejectedValue(original)
    const runner = new MSSQLQueryRunner(connection)
    const contexto = crearContextoDeRequest()

    await requestLogContextStorage.run(contexto, async () => {
      await expect(runner.runInTransaction(credentials, UserTypeEnum.Internal, operarDentroDeLaTransaccion)).rejects.toBe(original)
    })

    expect(contexto.databaseOperationCallsite?.operation).toBe('query')
    expect(contexto.databaseOperationCallsite?.statement).toBe('SELECT 1')
  })

  it('debería capturar el repositorio llamador dentro del contexto de transacción', async () => {
    const original = new sql.RequestError('trabajo rechazado', 'EREQUEST')
    transactionControl.request.query.mockRejectedValue(original)
    const runner = new MSSQLQueryRunner(connection)
    const contexto = crearContextoDeRequest()

    await requestLogContextStorage.run(contexto, async () => {
      await expect(runner.runInTransaction(credentials, UserTypeEnum.Internal, operarDentroDeLaTransaccion)).rejects.toBe(original)
    })

    const stack = contexto.databaseOperationCallsite?.stack ?? ''
    const primerFrame = stack.split('\n').filter(linea => linea.trim().startsWith('at '))[0] ?? ''

    expect(primerFrame).toContain('operarDentroDeLaTransaccion')
    expect(primerFrame).not.toContain('MSSQLQueryRunner')
  })

  it('debería respetar connect, construcción, begin, query y commit en ese orden', async () => {
    const rawResult = { recordset: [{ id: 3 }] }
    transactionControl.request.query.mockResolvedValue(rawResult)
    const runner = new MSSQLQueryRunner(connection)

    const result = await runner.runInTransaction(credentials, UserTypeEnum.Internal, transaction =>
      transaction.query({ statement: 'SELECT @id', parameters: [{ name: 'id', type: sql.Int, value: 3 }] }),
    )

    expect(result).toBe(rawResult)
    expect(transactionControl.request.input).toHaveBeenCalledWith('id', sql.Int, 3)
    expect(transactionControl.rollback).not.toHaveBeenCalled()
    expectCallOrder(
      connect.mock.invocationCallOrder[0],
      transactionControl.constructTransaction.mock.invocationCallOrder[0],
      transactionControl.begin.mock.invocationCallOrder[0],
      transactionControl.constructRequest.mock.invocationCallOrder[0],
      transactionControl.request.query.mock.invocationCallOrder[0],
      transactionControl.commit.mock.invocationCallOrder[0],
    )
  })

  it('debería hacer rollback ante un fallo de begin, sin ejecutar trabajo ni commit, y propagar el error crudo', async () => {
    const original = new sql.TransactionError('begin rechazado', 'EBEGIN')
    transactionControl.begin.mockRejectedValue(original)
    const work = vi.fn()
    const runner = new MSSQLQueryRunner(connection)

    const operation = runner.runInTransaction(credentials, UserTypeEnum.Internal, work)

    await expect(operation).rejects.toBe(original)
    expect(work).not.toHaveBeenCalled()
    expect(transactionControl.constructRequest).not.toHaveBeenCalled()
    expect(transactionControl.commit).not.toHaveBeenCalled()
    expect(transactionControl.rollback).toHaveBeenCalledTimes(1)
  })

  it('debería hacer rollback tras un fallo de commit y preservar ese error crudo', async () => {
    const original = new sql.TransactionError('commit rechazado', 'ECOMMIT')
    transactionControl.commit.mockRejectedValue(original)
    const work = vi.fn(async () => 'resultado')
    const runner = new MSSQLQueryRunner(connection)

    const operation = runner.runInTransaction(credentials, UserTypeEnum.Internal, work)

    await expect(operation).rejects.toBe(original)
    expect(transactionControl.rollback).toHaveBeenCalledTimes(1)
    expectCallOrder(
      work.mock.invocationCallOrder[0],
      transactionControl.commit.mock.invocationCallOrder[0],
      transactionControl.rollback.mock.invocationCallOrder[0],
    )
  })

  it('debería permitir un rollback explícito sin confirmar la transacción', async () => {
    const runner = new MSSQLQueryRunner(connection)

    const result = await runner.runInTransaction(credentials, UserTypeEnum.Internal, async ({ rollback }) => {
      await rollback()
      return null
    })

    expect(result).toBeNull()
    expect(transactionControl.rollback).toHaveBeenCalledTimes(1)
    expect(transactionControl.commit).not.toHaveBeenCalled()
  })

  it('debería hacer rollback y propagar crudo un error de mapeo del callback', async () => {
    const mappingError = new Error('fila inválida')
    const runner = new MSSQLQueryRunner(connection)

    const operation = runner.runInTransaction(credentials, UserTypeEnum.Internal, async () => {
      throw mappingError
    })

    await expect(operation).rejects.toBe(mappingError)
    expect(transactionControl.rollback).toHaveBeenCalledTimes(1)
    expect(transactionControl.commit).not.toHaveBeenCalled()
  })

  it('debería preservar el error crudo de query cuando también falla el rollback', async () => {
    const original = new sql.RequestError('trabajo rechazado', 'EREQUEST')
    const rollbackError = new sql.TransactionError('rollback rechazado', 'EROLLBACK')
    transactionControl.request.query.mockRejectedValue(original)
    transactionControl.rollback.mockRejectedValue(rollbackError)
    const runner = new MSSQLQueryRunner(connection)

    const operation = runner.runInTransaction(credentials, UserTypeEnum.Internal, transaction =>
      transaction.query({ statement: 'SELECT 1' }),
    )

    await expect(operation).rejects.toBe(original)
    expect(transactionControl.rollback).toHaveBeenCalledTimes(1)
  })
})
