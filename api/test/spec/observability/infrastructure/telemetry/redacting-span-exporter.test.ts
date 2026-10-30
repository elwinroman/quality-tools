import { RedactingSpanExporter, redactSpan } from '@observability/infrastructure/telemetry/redacting-span-exporter'
import { BasicTracerProvider, type ReadableSpan, type SpanExporter } from '@opentelemetry/sdk-trace-base'
import { describe, expect, it, vi } from 'vitest'

type ExportResult = Parameters<SpanExporter['export']>[1] extends (result: infer Result) => void ? Result : never

const SUCCESS_RESULT = { code: 0 } as ExportResult

function buildSpan(attributes: ReadableSpan['attributes']): ReadableSpan {
  return { attributes } as ReadableSpan
}

function buildDelegate(): SpanExporter {
  return {
    export: vi.fn((_spans: ReadableSpan[], resultCallback: (result: ExportResult) => void) => {
      resultCallback(SUCCESS_RESULT)
    }),
    shutdown: vi.fn(async () => undefined),
    forceFlush: vi.fn(async () => undefined),
  }
}

describe('redactSpan', () => {
  it('debería conservar db.statement y db.query.text y eliminar db.user', () => {
    const span = buildSpan({
      'db.statement': 'SELECT * FROM usuarios WHERE idUsuario = @idUsuario',
      'db.query.text': 'SELECT * FROM usuarios WHERE idUsuario = @idUsuario',
      'db.user': 'sa',
    })

    const redacted = redactSpan(span)

    expect(redacted.attributes).toEqual({
      'db.statement': 'SELECT * FROM usuarios WHERE idUsuario = @idUsuario',
      'db.query.text': 'SELECT * FROM usuarios WHERE idUsuario = @idUsuario',
    })
    expect(redacted.attributes).not.toHaveProperty('db.user')
  })

  it('debería conservar el SQL, la metadata de conexión y los atributos ajenos', () => {
    const span = buildSpan({
      'db.statement': 'SELECT 1',
      'db.query.text': 'SELECT 1',
      'db.user': 'sa',
      'db.namespace': 'quality_tools',
      'db.name': 'quality_tools',
      'db.system': 'mssql',
      'db.system.name': 'microsoft.sql_server',
      'net.peer.name': 'sqlserver',
      'server.address': 'sqlserver',
      'tedious.statement_count': 3,
      'custom.attribute': 'se conserva',
    })

    const redacted = redactSpan(span)

    expect(redacted.attributes).toEqual({
      'db.statement': 'SELECT 1',
      'db.query.text': 'SELECT 1',
      'db.namespace': 'quality_tools',
      'db.name': 'quality_tools',
      'db.system': 'mssql',
      'db.system.name': 'microsoft.sql_server',
      'net.peer.name': 'sqlserver',
      'server.address': 'sqlserver',
      'tedious.statement_count': 3,
      'custom.attribute': 'se conserva',
    })
    expect(redacted.attributes).not.toHaveProperty('db.user')
  })

  it('debería normalizar y renombrar spans de base de datos', () => {
    const span = {
      ...buildSpan({
        'db.system': 'mssql',
        'db.statement': '  SELECT p.name\n FROM sys.database_permissions p  ',
        'db.query.text': '  SELECT p.name\n FROM sys.database_permissions p  ',
      }),
      name: 'execSql SI_BDPruebasInternas10',
    }

    const redacted = redactSpan(span)

    expect(redacted.name).toBe('SELECT sys.database_permissions')
    expect(redacted.attributes['db.statement']).toBe('SELECT p.name FROM sys.database_permissions p')
    expect(redacted.attributes['db.query.text']).toBe('SELECT p.name FROM sys.database_permissions p')
  })

  it('debería conservar nombre y atributos SQL de spans ajenos a base de datos', () => {
    const span = {
      ...buildSpan({ 'db.statement': '  SELECT\n  1  ', custom: 'se conserva' }),
      name: 'consulta personalizada',
    }

    const redacted = redactSpan(span)

    expect(redacted.name).toBe('consulta personalizada')
    expect(redacted.attributes).toEqual({ 'db.statement': '  SELECT\n  1  ', custom: 'se conserva' })
  })

  it('no debería mutar los attributes del span original', () => {
    const originalAttributes = {
      'db.statement': 'SELECT * FROM usuarios',
      'db.query.text': 'SELECT * FROM usuarios',
      'db.user': 'sa',
      'db.namespace': 'quality_tools',
    }
    const span = buildSpan(originalAttributes)

    const redacted = redactSpan(span)

    expect(span.attributes).toBe(originalAttributes)
    expect(span.attributes).toEqual(originalAttributes)
    expect(redacted.attributes).not.toBe(span.attributes)
  })

  it('debería devolver un ReadableSpan válido a partir de un span real del SDK', async () => {
    const provider = new BasicTracerProvider()
    const span = provider.getTracer('redaction-test').startSpan('execSql', {
      attributes: {
        'db.statement': 'SELECT * FROM usuarios',
        'db.query.text': 'SELECT * FROM usuarios',
        'db.user': 'sa',
        'db.namespace': 'quality_tools',
      },
    })
    span.end()

    const readable = span as unknown as ReadableSpan
    const redacted = redactSpan(readable)

    expect(redacted.name).toBe('execSql')
    expect(redacted.spanContext()).toEqual(readable.spanContext())
    expect(redacted.duration).toEqual(readable.duration)
    expect(redacted.ended).toBe(true)
    expect(redacted.attributes).toEqual({
      'db.statement': 'SELECT * FROM usuarios',
      'db.query.text': 'SELECT * FROM usuarios',
      'db.namespace': 'quality_tools',
    })

    await provider.shutdown()
  })
})

describe('RedactingSpanExporter', () => {
  it('debería entregar al delegate los spans redactados y propagar el callback de resultado', () => {
    const delegate = buildDelegate()
    const exporter = new RedactingSpanExporter(delegate)
    const resultCallback = vi.fn()
    const span = buildSpan({
      'db.statement': 'SELECT * FROM usuarios',
      'db.query.text': 'SELECT * FROM usuarios',
      'db.user': 'sa',
      'db.namespace': 'quality_tools',
      'custom.attribute': 'se conserva',
    })

    exporter.export([span], resultCallback)

    const exportedSpans = vi.mocked(delegate.export).mock.calls[0][0]
    expect(exportedSpans).toHaveLength(1)
    expect(exportedSpans[0].attributes).toEqual({
      'db.statement': 'SELECT * FROM usuarios',
      'db.query.text': 'SELECT * FROM usuarios',
      'db.namespace': 'quality_tools',
      'custom.attribute': 'se conserva',
    })
    expect(exportedSpans[0].attributes).not.toHaveProperty('db.user')
    expect(resultCallback).toHaveBeenCalledWith(SUCCESS_RESULT)
  })

  it('debería propagar shutdown y forceFlush al delegate', async () => {
    const delegate = buildDelegate()
    const exporter = new RedactingSpanExporter(delegate)

    await exporter.shutdown()
    await exporter.forceFlush()

    expect(vi.mocked(delegate.shutdown)).toHaveBeenCalledOnce()
    expect(vi.mocked(delegate.forceFlush!)).toHaveBeenCalledOnce()
  })
})
