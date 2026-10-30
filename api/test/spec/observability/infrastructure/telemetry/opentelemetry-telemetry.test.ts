import { ExpressLayerType } from '@opentelemetry/instrumentation-express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  BatchSpanProcessor,
  NodeSDK,
  OTLPMetricExporter,
  OTLPTraceExporter,
  PeriodicExportingMetricReader,
  getNodeAutoInstrumentations,
  sdkShutdown,
  sdkStart,
} = vi.hoisted(() => ({
  BatchSpanProcessor: vi.fn(),
  NodeSDK: vi.fn(),
  OTLPMetricExporter: vi.fn(),
  OTLPTraceExporter: vi.fn(),
  PeriodicExportingMetricReader: vi.fn(),
  getNodeAutoInstrumentations: vi.fn(() => []),
  sdkShutdown: vi.fn(async () => undefined),
  sdkStart: vi.fn(),
}))

vi.mock('@opentelemetry/auto-instrumentations-node', () => ({ getNodeAutoInstrumentations }))
vi.mock('@opentelemetry/exporter-metrics-otlp-http', () => ({ OTLPMetricExporter }))
vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({ OTLPTraceExporter }))
vi.mock('@opentelemetry/sdk-metrics', () => ({ PeriodicExportingMetricReader }))
vi.mock('@opentelemetry/sdk-node', () => ({ NodeSDK }))
vi.mock('@opentelemetry/sdk-trace-base', () => ({ BatchSpanProcessor }))

interface TelemetryConfig {
  OTEL_EXPORTER_OTLP_ENDPOINT: string
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT?: string
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?: string
  OTEL_METRICS_ENABLED: boolean
  OTEL_TRACES_ENABLED: boolean
}

const defaultConfig: TelemetryConfig = {
  OTEL_EXPORTER_OTLP_ENDPOINT: 'http://otel-collector:4318/',
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: undefined,
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: undefined,
  OTEL_METRICS_ENABLED: false,
  OTEL_TRACES_ENABLED: false,
}

async function loadTelemetry(overrides: Partial<TelemetryConfig> = {}) {
  vi.doMock('@/config/enviroment', () => ({
    OTEL_DEPLOYMENT_ENV: 'test',
    OTEL_METRIC_EXPORT_INTERVAL: 15000,
    OTEL_METRIC_EXPORT_TIMEOUT: 5000,
    OTEL_RESOURCE_ATTRIBUTES: 'project=quality-tools',
    OTEL_SERVICE_NAME: 'quality-tools-api',
    ...defaultConfig,
    ...overrides,
  }))

  return await import('@observability/infrastructure/telemetry/opentelemetry-telemetry')
}

describe('opentelemetry-telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    NodeSDK.mockImplementation(() => ({ start: sdkStart, shutdown: sdkShutdown }))
  })

  describe('buildTracesEndpointUrl', () => {
    it('debería preferir OTEL_EXPORTER_OTLP_TRACES_ENDPOINT cuando está configurado', async () => {
      const { buildTracesEndpointUrl } = await loadTelemetry({
        OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'http://tempo:4318/custom/v1/traces',
      })

      expect(buildTracesEndpointUrl()).toBe('http://tempo:4318/custom/v1/traces')
    })

    it('debería derivar /v1/traces desde el base recortando la barra final', async () => {
      const { buildTracesEndpointUrl } = await loadTelemetry({
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://otel-collector:4318/',
      })

      expect(buildTracesEndpointUrl()).toBe('http://otel-collector:4318/v1/traces')
    })

    it('debería derivar /v1/traces sin duplicar la barra cuando el base no la tiene', async () => {
      const { buildTracesEndpointUrl } = await loadTelemetry({
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://otel-collector:4318',
      })

      expect(buildTracesEndpointUrl()).toBe('http://otel-collector:4318/v1/traces')
    })
  })

  describe('startTelemetry', () => {
    it('no debería construir el SDK cuando métricas y traces están desactivados', async () => {
      const { startTelemetry, shutdownTelemetry } = await loadTelemetry()

      startTelemetry()

      expect(NodeSDK).not.toHaveBeenCalled()
      await expect(shutdownTelemetry()).resolves.toBeUndefined()
    })

    it('debería arrancar sólo traces cuando OTEL_TRACES_ENABLED=true', async () => {
      const { startTelemetry } = await loadTelemetry({ OTEL_TRACES_ENABLED: true })

      startTelemetry()

      expect(NodeSDK).toHaveBeenCalledOnce()
      const configuration = NodeSDK.mock.calls[0][0]
      expect(configuration.spanProcessors).toHaveLength(1)
      expect(BatchSpanProcessor).toHaveBeenCalledOnce()
      expect(OTLPTraceExporter).toHaveBeenCalledWith({ url: 'http://otel-collector:4318/v1/traces' })
      expect(configuration.metricReaders).toEqual([])
      expect(sdkStart).toHaveBeenCalledOnce()
    })

    it('debería mantener métricas y apagar traces cuando sólo métricas está activo', async () => {
      const { startTelemetry } = await loadTelemetry({ OTEL_METRICS_ENABLED: true })

      startTelemetry()

      expect(NodeSDK).toHaveBeenCalledOnce()
      const configuration = NodeSDK.mock.calls[0][0]
      expect(configuration.spanProcessors).toEqual([])
      expect(PeriodicExportingMetricReader).toHaveBeenCalledOnce()
      expect(OTLPMetricExporter).toHaveBeenCalledWith({
        url: 'http://otel-collector:4318/v1/metrics',
        timeoutMillis: 5000,
      })
      expect(sdkStart).toHaveBeenCalledOnce()
    })

    it('no debería autodetectar recursos del proceso ni del host', async () => {
      const { startTelemetry } = await loadTelemetry({ OTEL_TRACES_ENABLED: true })

      startTelemetry()

      expect(NodeSDK.mock.calls[0][0].autoDetectResources).toBe(false)
    })

    it('debería apagar dns, net y el preflight CORS, y filtrar middleware de Express', async () => {
      const { startTelemetry } = await loadTelemetry({ OTEL_TRACES_ENABLED: true })

      startTelemetry()

      expect(getNodeAutoInstrumentations).toHaveBeenCalledWith(
        expect.objectContaining({
          '@opentelemetry/instrumentation-dns': { enabled: false },
          '@opentelemetry/instrumentation-net': { enabled: false },
          '@opentelemetry/instrumentation-express': { ignoreLayersType: [ExpressLayerType.MIDDLEWARE] },
          '@opentelemetry/instrumentation-http': { ignoreIncomingRequestHook: expect.any(Function) },
        }),
      )
    })

    it('debería ignorar solo los requests OPTIONS como preflight', async () => {
      const { shouldIgnoreIncomingRequest } = await loadTelemetry()

      expect(shouldIgnoreIncomingRequest({ method: 'OPTIONS' })).toBe(true)
      expect(shouldIgnoreIncomingRequest({ method: 'GET' })).toBe(false)
      expect(shouldIgnoreIncomingRequest({ method: 'POST' })).toBe(false)
      expect(shouldIgnoreIncomingRequest({})).toBe(false)
    })

    it('debería iniciar el SDK una sola vez aunque se invoque repetido', async () => {
      const { startTelemetry } = await loadTelemetry({ OTEL_TRACES_ENABLED: true })

      startTelemetry()
      startTelemetry()

      expect(NodeSDK).toHaveBeenCalledOnce()
    })

    it('debería reiniciar el estado si el SDK falla al arrancar', async () => {
      const { startTelemetry } = await loadTelemetry({ OTEL_TRACES_ENABLED: true })
      sdkStart.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

      startTelemetry()
      startTelemetry()

      expect(NodeSDK).toHaveBeenCalledTimes(2)
      warn.mockRestore()
    })
  })
})
