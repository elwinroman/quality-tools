import { handleErrorMiddleware } from '@core/middlewares/handle-error.middleware'
import { sentryScopeError } from '@core/sentry/sentryScopeError'
import { Request, Response } from 'express'
import sql from 'mssql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@core/sentry/sentryScopeError', () => ({ sentryScopeError: vi.fn() }))
vi.mock('@observability/infrastructure/logging/logger-instance', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

/** Doble mínimo de Express: sólo se observa el status y el cuerpo de la respuesta. */
function crearRespuesta(): { res: Response; status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  return { res: { status } as unknown as Response, status, json }
}

const req = { correlationId: 'corr-test' } as unknown as Request
const next = vi.fn()

describe('handleErrorMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clasifica un error crudo de MSSQL y responde 500 enmascarado', () => {
    const error = new sql.RequestError('consulta rechazada por el motor', 'EREQUEST')
    const { res, status, json } = crearRespuesta()

    handleErrorMiddleware(error, req, res, next)

    expect(status).toHaveBeenCalledWith(500)
    const body = json.mock.calls[0]?.[0] as { error: { status: number; detail: string } }
    expect(body.error.status).toBe(500)
    expect(body.error.detail).not.toContain('consulta rechazada por el motor')
    expect(sentryScopeError).toHaveBeenCalledWith(error)
  })

  it('clasifica un fallo desconocido de base de datos como 500 enmascarado', () => {
    const error = new Error('fallo inesperado en la operación de base de datos')
    const { res, status, json } = crearRespuesta()

    handleErrorMiddleware(error, req, res, next)

    expect(status).toHaveBeenCalledWith(500)
    const body = json.mock.calls[0]?.[0] as { error: { status: number; detail: string } }
    expect(body.error.status).toBe(500)
    expect(body.error.detail).not.toContain('fallo inesperado en la operación de base de datos')
    expect(sentryScopeError).toHaveBeenCalledWith(error)
  })

  it('enmascara cada tipo de error crudo de MSSQL con 500', () => {
    const errores = [
      new sql.ConnectionError('conexión cerrada', 'ECONNCLOSED'),
      new sql.PreparedStatementError('sentencia inválida', 'EPREPARE'),
      new sql.TransactionError('transacción inválida', 'ETRAN'),
    ]
    const detailEnmascarado =
      'No se pudo completar la operación con la base de datos. Si el problema persiste, contacte con el administrador.'

    for (const error of errores) {
      const { res, status, json } = crearRespuesta()
      handleErrorMiddleware(error, req, res, next)

      expect(status).toHaveBeenCalledWith(500)

      const body = json.mock.calls[0]?.[0] as { error: { status: number; detail: string } }
      expect(body.error.status).toBe(500)
      expect(body.error.detail).toBe(detailEnmascarado)

      // El cuerpo no debe filtrar ni el mensaje ni el código crudo del driver.
      const serializado = JSON.stringify(body)
      expect(serializado).not.toContain(error.message)
      expect(serializado).not.toContain(error.code)
    }
  })
})
