import { InvalidCredentialsException } from '@auth/domain/exceptions/invalid-credentials.exception'
import { MSSQLDatabaseConnection, UserTypeEnum } from '@core/store/mssql-database-connection'
import type { StoreUserSchema } from '@shared/domain/store'
import sql from 'mssql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Per-test control for the mocked `ConnectionPool.connect()`.
 * `vi.hoisted` lifts this state above the hoisted `vi.mock` factory.
 */
const { connectionPoolControl } = vi.hoisted(() => ({
  connectionPoolControl: { nextError: undefined as unknown },
}))

/**
 * Replaces only `ConnectionPool`. The real error classes are preserved from the
 * actual module so `err instanceof sql.ConnectionError` inside the module under
 * test keeps working, and no real socket is ever opened.
 */
vi.mock('mssql', async importOriginal => {
  const actual = await importOriginal<typeof import('mssql')>()
  const interop = actual as typeof actual & { default?: Record<string, unknown> }
  const actualExports = (interop.default ?? actual) as unknown as Record<string, unknown>

  class ConnectionPoolMock {
    connect(): Promise<never> {
      return Promise.reject(connectionPoolControl.nextError)
    }
  }

  return {
    ...actual,
    default: { ...actualExports, ConnectionPool: ConnectionPoolMock },
    ConnectionPool: ConnectionPoolMock,
  }
})

/**
 * Returns the rejection reason of `promise`, or the resolved value when it does
 * not reject. Lets every assertion inspect the rejected error's fields.
 */
async function captureSettled(promise: Promise<unknown>): Promise<unknown> {
  try {
    return await promise
  } catch (error) {
    return error
  }
}

// Distinct credentials per case: the class caches pools by JSON.stringify(config).
const externalLoginCredentials: StoreUserSchema = {
  host: 'auth-external.example.com',
  database: 'external_db',
  user: 'external_user',
  password: 'external_password',
}

const externalSocketCredentials: StoreUserSchema = {
  host: 'unreachable-host.example.com',
  database: 'unreachable_db',
  user: 'unreachable_user',
  password: 'unreachable_password',
}

const internalLoginCredentials: StoreUserSchema = {
  host: 'app-internal.example.com',
  database: 'app_db',
  user: 'app_user',
  password: 'app_password',
}

describe('MSSQLDatabaseConnection.connect', () => {
  beforeEach(() => {
    connectionPoolControl.nextError = undefined
  })

  it('traduce ELOGIN de un usuario externo en InvalidCredentialsException con el motivo de credenciales', async () => {
    connectionPoolControl.nextError = new sql.ConnectionError('Login failed for user', 'ELOGIN')

    const connection = new MSSQLDatabaseConnection()
    const error = await captureSettled(connection.connect(externalLoginCredentials, UserTypeEnum.External))

    expect(error).toBeInstanceOf(InvalidCredentialsException)
    expect((error as InvalidCredentialsException).detail).toContain('Verifique sus credenciales.')
  })

  it('traduce ESOCKET de un usuario externo en InvalidCredentialsException con el motivo de servidor no encontrado', async () => {
    connectionPoolControl.nextError = new sql.ConnectionError('Failed to connect to server', 'ESOCKET')

    const connection = new MSSQLDatabaseConnection()
    const error = await captureSettled(connection.connect(externalSocketCredentials, UserTypeEnum.External))

    expect(error).toBeInstanceOf(InvalidCredentialsException)
    expect((error as InvalidCredentialsException).detail).toContain('No se encontró el servidor.')
  })

  it('relanza el ConnectionError original cuando las credenciales internas de la aplicación fallan con ELOGIN', async () => {
    const originalError = new sql.ConnectionError('Login failed for application user', 'ELOGIN')
    connectionPoolControl.nextError = originalError

    const connection = new MSSQLDatabaseConnection()
    const error = await captureSettled(connection.connect(internalLoginCredentials, UserTypeEnum.Internal))

    expect(error).toBe(originalError)
    expect(error).toBeInstanceOf(sql.ConnectionError)
    expect(error).not.toBeInstanceOf(InvalidCredentialsException)
  })
})
