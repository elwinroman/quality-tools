import { OpenTelemetryLogger } from '@observability/infrastructure/logging/opentelemetry/opentelemetry-logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { buildLogContext, emit, flattenLogAttributes, getLogger, providerShutdown } = vi.hoisted(() => ({
  buildLogContext: vi.fn(),
  emit: vi.fn(),
  flattenLogAttributes: vi.fn(),
  getLogger: vi.fn(),
  providerShutdown: vi.fn(),
}))

vi.mock('@observability/infrastructure/logging/log-attributes.mapper', () => ({ buildLogContext, flattenLogAttributes }))
vi.mock('@/config/enviroment', () => ({
  OTEL_DEPLOYMENT_ENV: 'test',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector:4318',
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: undefined,
  OTEL_LOG_EXPORT_INTERVAL: 5000,
  OTEL_LOG_EXPORT_TIMEOUT: 5000,
  LOG_EXPORT_LEVEL: 'error',
  OTEL_RESOURCE_ATTRIBUTES: 'project=quality-tools',
  OTEL_SERVICE_NAME: 'quality-tools-api',
}))
vi.mock('@opentelemetry/exporter-logs-otlp-http', () => ({ OTLPLogExporter: vi.fn() }))
vi.mock('@opentelemetry/sdk-logs', () => ({
  BatchLogRecordProcessor: vi.fn(),
  LoggerProvider: vi.fn().mockImplementation(() => ({ getLogger, shutdown: providerShutdown })),
}))

describe('OpenTelemetryLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getLogger.mockReturnValue({ emit })
    buildLogContext.mockReturnValue({ nested: { value: 1 } })
    flattenLogAttributes.mockReturnValue({ 'nested.value': 1 })
  })

  it('debería omitir el payload bajo el nivel configurado y emitir los errores aceptados', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(123456)
    const logger = new OpenTelemetryLogger()

    logger.info('filtered', { expensive: true })

    expect(buildLogContext).not.toHaveBeenCalled()
    expect(flattenLogAttributes).not.toHaveBeenCalled()
    expect(now).not.toHaveBeenCalled()
    expect(emit).not.toHaveBeenCalled()

    logger.error('accepted', { action: 'save' })

    expect(buildLogContext).toHaveBeenCalledWith({ action: 'save' })
    expect(flattenLogAttributes).toHaveBeenCalledWith({ nested: { value: 1 } })
    expect(now).toHaveBeenCalledOnce()
    expect(emit).toHaveBeenCalledWith({
      timestamp: 123456,
      severityNumber: expect.any(Number),
      severityText: 'ERROR',
      body: 'accepted',
      attributes: { 'nested.value': 1 },
    })

    now.mockRestore()
  })

  it('debería liberar el proveedor OTLP al apagar para vaciar los lotes pendientes', async () => {
    const logger = new OpenTelemetryLogger()

    await expect(logger.shutdown()).resolves.toBeUndefined()
    expect(providerShutdown).toHaveBeenCalledOnce()
  })
})
