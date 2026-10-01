import { setDatabaseOperationCallsite } from '@observability/infrastructure/context/request-log-context.storage'
import { logger } from '@observability/infrastructure/logging/logger-instance'
import type { StoreUserSchema } from '@shared/domain/store'
import sql from 'mssql'

import type { MSSQLConnection } from './mssql-connection'
import type { UserType } from './mssql-database-connection'

export interface MSSQLParameter {
  name: string
  type: (() => sql.ISqlType) | sql.ISqlType
  value: unknown
}

interface MSSQLCommand {
  credentials: StoreUserSchema
  userType: UserType
  parameters?: readonly MSSQLParameter[]
}

export interface MSSQLQueryCommand extends MSSQLCommand {
  statement: string
}

export interface MSSQLProcedureCommand extends MSSQLCommand {
  procedure: string
}

export type MSSQLTransactionQueryCommand = Omit<MSSQLQueryCommand, 'credentials' | 'userType'>
export type MSSQLTransactionProcedureCommand = Omit<MSSQLProcedureCommand, 'credentials' | 'userType'>

export interface MSSQLExecutor {
  query<T>(command: MSSQLQueryCommand): Promise<sql.IResult<T>>
  execute<T>(command: MSSQLProcedureCommand): Promise<sql.IProcedureResult<T>>
}

export interface MSSQLTransactionContext {
  query<T>(command: MSSQLTransactionQueryCommand): Promise<sql.IResult<T>>
  execute<T>(command: MSSQLTransactionProcedureCommand): Promise<sql.IProcedureResult<T>>
  rollback(): Promise<void>
}

export interface MSSQLTransactionRunner {
  runInTransaction<T>(
    credentials: StoreUserSchema,
    userType: UserType,
    operation: (context: MSSQLTransactionContext) => Promise<T>,
  ): Promise<T>
}

/** Etiqueta de operación para una consulta directa. */
const QUERY_OPERATION = 'query'
/** Etiqueta de operación para un procedimiento almacenado. */
const EXECUTE_OPERATION = 'execute'
/** Respaldo cuando el comando no expone una etiqueta reconocible. */
const DEFAULT_OPERATION = 'database'

/**
 * Ejecuta consultas y procedimientos sobre MSSQL sin transformar errores.
 *
 * Antes de delegar en el driver, cada operación registra su punto de llamada en el contexto
 * de la request con `Error.captureStackTrace(_, <método público>)`. Así el primer frame
 * capturado es el repositorio que llamó al ejecutor, no este. El error crudo de MSSQL
 * —incluidos `code` y `number`— se propaga intacto: la clasificación vive en el middleware global.
 *
 * El punto de llamada se limpia únicamente cuando la operación termina bien; si falla, queda
 * disponible para el reporte. Ver la limitación de un solo slot en `DatabaseOperationCallsite`.
 */
export class MSSQLQueryRunner implements MSSQLExecutor, MSSQLTransactionRunner {
  constructor(private readonly connection: MSSQLConnection) {}

  async query<T>(command: MSSQLQueryCommand): Promise<sql.IResult<T>> {
    this.captureDatabaseOperation(QUERY_OPERATION, command.statement, this.query)

    const pool = await this.connection.connect(command.credentials, command.userType)
    const request = pool.request()
    this.bindParameters(request, command.parameters)
    const result = await request.query<T>(command.statement)

    setDatabaseOperationCallsite(undefined)

    return result
  }

  async execute<T>(command: MSSQLProcedureCommand): Promise<sql.IProcedureResult<T>> {
    this.captureDatabaseOperation(EXECUTE_OPERATION, command.procedure, this.execute)

    const pool = await this.connection.connect(command.credentials, command.userType)
    const request = pool.request()
    this.bindParameters(request, command.parameters)
    const result = await request.execute<T>(command.procedure)

    setDatabaseOperationCallsite(undefined)

    return result
  }

  async runInTransaction<T>(
    credentials: StoreUserSchema,
    userType: UserType,
    operation: (context: MSSQLTransactionContext) => Promise<T>,
  ): Promise<T> {
    let transaction: sql.Transaction | null = null
    let rolledBack = false

    try {
      const pool = await this.connection.connect(credentials, userType)
      const activeTransaction = new sql.Transaction(pool)
      transaction = activeTransaction
      await activeTransaction.begin()

      const transactionContext: MSSQLTransactionContext = {
        query: async <T>(command: MSSQLTransactionQueryCommand): Promise<sql.IResult<T>> => {
          this.captureDatabaseOperation(QUERY_OPERATION, command.statement, transactionContext.query)
          const result = await this.runTransactionQuery<T>(activeTransaction, command)
          setDatabaseOperationCallsite(undefined)
          return result
        },
        execute: async <T>(command: MSSQLTransactionProcedureCommand): Promise<sql.IProcedureResult<T>> => {
          this.captureDatabaseOperation(EXECUTE_OPERATION, command.procedure, transactionContext.execute)
          const result = await this.runTransactionProcedure<T>(activeTransaction, command)
          setDatabaseOperationCallsite(undefined)
          return result
        },
        rollback: async () => {
          await activeTransaction.rollback()
          rolledBack = true
        },
      }

      const result = await operation(transactionContext)

      if (!rolledBack) await activeTransaction.commit()

      return result
    } catch (err) {
      if (transaction) {
        try {
          await transaction.rollback()
        } catch (rollbackError) {
          // El rollback falló, pero el error original es el que debe propagarse sin reemplazo.
          logger.error('[auth] Error al hacer rollback:', { rollbackError })
        }
      }

      throw err
    }
  }

  /**
   * Registra el contexto de diagnóstico de una operación eligiendo los campos de forma explícita.
   *
   * El comando nunca se copia entero: si se esparciera, `credentials` (host, usuario, password)
   * y `parameters[].value` viajarían al contexto y podrían terminar en Sentry. Por eso sólo se
   * seleccionan la etiqueta de la operación y el statement (o el nombre del procedimiento).
   */
  private captureDatabaseOperation(operation: string, statement: string, omittedFrame: (...args: never[]) => unknown): void {
    const callsite: { stack?: string } = {}
    // `omittedFrame` y los frames más recientes se excluyen: el primer frame es el repositorio llamador.
    Error.captureStackTrace(callsite, omittedFrame)
    setDatabaseOperationCallsite({
      operation: operation || DEFAULT_OPERATION,
      stack: callsite.stack,
      statement,
    })
  }

  private async runTransactionQuery<T>(transaction: sql.Transaction, command: MSSQLTransactionQueryCommand): Promise<sql.IResult<T>> {
    const request = new sql.Request(transaction)
    this.bindParameters(request, command.parameters)
    return request.query<T>(command.statement)
  }

  private async runTransactionProcedure<T>(
    transaction: sql.Transaction,
    command: MSSQLTransactionProcedureCommand,
  ): Promise<sql.IProcedureResult<T>> {
    const request = new sql.Request(transaction)
    this.bindParameters(request, command.parameters)
    return request.execute<T>(command.procedure)
  }

  private bindParameters(request: sql.Request, parameters: readonly MSSQLParameter[] = []): void {
    for (const parameter of parameters) request.input(parameter.name, parameter.type, parameter.value)
  }
}
