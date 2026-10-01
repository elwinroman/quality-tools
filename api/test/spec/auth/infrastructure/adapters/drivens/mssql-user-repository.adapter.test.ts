import { User } from '@auth/domain/schemas/user'
import { MssqlUserRepositoryAdapter } from '@auth/infrastructure/adapters/drivens/mssql-user-repository.adapter'
import type { UserType } from '@core/store/mssql-database-connection'
import type { MSSQLExecutor, MSSQLTransactionContext, MSSQLTransactionRunner } from '@core/store/mssql-query-runner'
import type { StoreUserSchema } from '@shared/domain/store'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@core/store/get-static-store-credentials', () => ({
  getStaticDatabaseCredentials: () => ({
    credentials: { host: 'host', database: 'database', user: 'user', password: 'password' },
    type: 'internal',
  }),
}))

describe('MssqlUserRepositoryAdapter.getOrCreate', () => {
  const executor = { query: vi.fn(), execute: vi.fn() } as unknown as MSSQLExecutor
  const transactionQuery = vi.fn()
  const rollback = vi.fn()

  const transactionRunner: MSSQLTransactionRunner = {
    async runInTransaction<T>(
      _credentials: StoreUserSchema,
      _userType: UserType,
      operation: (context: MSSQLTransactionContext) => Promise<T>,
    ): Promise<T> {
      return operation({ query: transactionQuery, execute: vi.fn(), rollback } as unknown as MSSQLTransactionContext)
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    rollback.mockResolvedValue(undefined)
  })

  it('debería solicitar rollback y devolver null cuando el MERGE no devuelve una fila', async () => {
    transactionQuery.mockResolvedValue({ recordset: [] })
    const adapter = new MssqlUserRepositoryAdapter(executor, transactionRunner)

    const user = User.create({
      user: 'usuario',
      host: 'servidor',
      aliasHost: 'alias',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      isActive: true,
    })

    const result = await adapter.getOrCreate(user.toValue(), 'database')

    expect(result).toBeNull()
    expect(rollback).toHaveBeenCalledTimes(1)
  })
})
