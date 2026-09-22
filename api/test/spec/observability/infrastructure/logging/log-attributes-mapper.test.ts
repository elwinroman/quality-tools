import { buildLogContext, flattenLogAttributes } from '@observability/infrastructure/logging/log-attributes.mapper'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestLogContext } = vi.hoisted(() => ({ getRequestLogContext: vi.fn() }))

vi.mock('@observability/infrastructure/context/request-log-context.storage', () => ({ getRequestLogContext }))

describe('flattenLogAttributes', () => {
  it('debería aplastar objetos anidados y omitir los valores undefined', () => {
    expect(flattenLogAttributes({ user: { id: 7, role: 'analista' }, missing: undefined })).toEqual({
      'user.id': 7,
      'user.role': 'analista',
    })
  })

  it('debería serializar los arreglos como JSON', () => {
    expect(flattenLogAttributes({ roles: ['admin', 'auditor'] })).toEqual({ roles: '["admin","auditor"]' })
  })

  it('debería convertir las fechas a ISO', () => {
    expect(flattenLogAttributes({ checkedAt: new Date('2026-01-15T10:00:00.000Z') })).toEqual({
      checkedAt: '2026-01-15T10:00:00.000Z',
    })
  })

  it('debería exponer name, message y stack de un Error', () => {
    const error = new Error('fallo de negocio')

    expect(flattenLogAttributes({ err: error })).toEqual({
      'err.name': 'Error',
      'err.message': 'fallo de negocio',
      'err.stack': error.stack,
    })
  })

  it('debería omitir el stack cuando el Error no lo tiene', () => {
    const error = new Error('sin stack')
    error.stack = undefined

    expect(flattenLogAttributes({ err: error })).toEqual({ 'err.name': 'Error', 'err.message': 'sin stack' })
  })

  it('debería conservar los primitivos y convertir el resto a texto', () => {
    expect(flattenLogAttributes({ text: 'a', count: 2, ok: true, empty: null })).toEqual({
      text: 'a',
      count: 2,
      ok: true,
      empty: 'null',
    })
  })
})

describe('buildLogContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestLogContext.mockReturnValue(undefined)
  })

  it('debería devolver el contexto explícito cuando no hay contexto de request', () => {
    expect(buildLogContext({ action: 'save' })).toEqual({ action: 'save' })
  })

  it('debería combinar el contexto de la request y excluir el objeto request', () => {
    getRequestLogContext.mockReturnValue({
      correlationId: 'correlation-1',
      auth: { status: 'authenticated' },
      request: { encabezado: 'no debería propagarse' },
    })

    expect(buildLogContext({ action: 'save' })).toEqual({
      correlationId: 'correlation-1',
      auth: { status: 'authenticated' },
      action: 'save',
    })
  })

  it('debería priorizar el contexto explícito sobre el de la request', () => {
    getRequestLogContext.mockReturnValue({ correlationId: 'correlation-1', auth: { status: 'anonymous' } })

    expect(buildLogContext({ correlationId: 'correlation-2' })).toEqual({
      auth: { status: 'anonymous' },
      correlationId: 'correlation-2',
    })
  })
})
