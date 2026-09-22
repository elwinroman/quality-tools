import { beforeEach, describe, expect, it, vi } from 'vitest'

const { OpenTelemetryLogger, PinoLogger, otelShutdown } = vi.hoisted(() => {
  const otelShutdown = vi.fn(async () => undefined)

  return {
    OpenTelemetryLogger: vi.fn(() => ({ shutdown: otelShutdown })),
    PinoLogger: vi.fn(),
    otelShutdown,
  }
})

vi.mock('@observability/infrastructure/logging/opentelemetry/opentelemetry-logger', () => ({ OpenTelemetryLogger }))
vi.mock('@observability/infrastructure/logging/pino/pino-logger', () => ({ PinoLogger }))

async function loadComposition(config: { CONSOLE_LOGS_ENABLED: boolean; OTEL_LOGS_ENABLED: boolean }) {
  vi.doMock('@/config/enviroment', () => config)

  return await import('@observability/infrastructure/logging/composition-root')
}

describe('createLoggerComposition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('no debería construir adaptadores si ambos están desactivados y debería finalizar de forma segura', async () => {
    const { createLoggerComposition } = await loadComposition({ CONSOLE_LOGS_ENABLED: false, OTEL_LOGS_ENABLED: false })
    const composition = createLoggerComposition()

    expect(PinoLogger).not.toHaveBeenCalled()
    expect(OpenTelemetryLogger).not.toHaveBeenCalled()

    expect(() => {
      composition.logger.debug('debug')
      composition.logger.info('info')
      composition.logger.warn('warn')
      composition.logger.error('error')
      composition.logger.fatal('fatal')
    }).not.toThrow()
    await expect(composition.shutdown()).resolves.toBeUndefined()
  })

  it('debería exportar sólo por OTLP y liberar el proveedor al apagar cuando la consola está desactivada', async () => {
    const { createLoggerComposition } = await loadComposition({ CONSOLE_LOGS_ENABLED: false, OTEL_LOGS_ENABLED: true })
    const composition = createLoggerComposition()

    expect(PinoLogger).not.toHaveBeenCalled()
    expect(OpenTelemetryLogger).toHaveBeenCalledOnce()

    await expect(composition.shutdown()).resolves.toBeUndefined()
    expect(otelShutdown).toHaveBeenCalledOnce()
  })
})
