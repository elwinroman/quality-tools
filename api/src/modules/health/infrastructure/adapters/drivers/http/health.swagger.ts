import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { registry } from '@core/swagger/openapi-registry'
import { z } from 'zod'

extendZodWithOpenApi(z)

const HealthStatusSchema = z.enum(['ok', 'degraded'])
const HealthCheckStatusSchema = z.enum(['up', 'down', 'skipped'])

const HealthLiveResponseSchema = z
  .object({
    correlationId: z.string().uuid(),
    status: z.literal('ok'),
    uptimeSeconds: z.number().openapi({ example: 120 }),
    timestamp: z.string().datetime().openapi({ example: '2026-06-28T10:30:00.000Z' }),
  })
  .openapi('HealthLiveResponse')

const HealthReadyResponseSchema = z
  .object({
    correlationId: z.string().uuid(),
    status: HealthStatusSchema,
    uptimeSeconds: z.number().openapi({ example: 120 }),
    timestamp: z.string().datetime().openapi({ example: '2026-06-28T10:30:00.000Z' }),
    summary: z.object({
      total: z.number().openapi({ example: 3 }),
      up: z.number().openapi({ example: 2 }),
      down: z.number().openapi({ example: 0 }),
      disabled: z.number().openapi({ example: 1 }),
      disabledServices: z.array(z.string()).openapi({ example: ['sentry'] }),
    }),
    checks: z.array(
      z.object({
        name: z.string().openapi({ example: 'cache' }),
        status: HealthCheckStatusSchema,
        latencyMs: z.number().openapi({ example: 4 }),
        details: z.record(z.unknown()).optional(),
        error: z.string().optional(),
      }),
    ),
  })
  .openapi('HealthReadyResponse')

// GET /status/live
registry.registerPath({
  method: 'get',
  path: '/status/live',
  tags: ['Health'],
  summary: 'Liveness de la API',
  description: 'Valida que el proceso Express esté vivo. No revisa dependencias externas.',
  responses: {
    200: {
      description: 'Proceso vivo',
      content: { 'application/json': { schema: HealthLiveResponseSchema } },
    },
  },
})

// GET /status/ready
registry.registerPath({
  method: 'get',
  path: '/status/ready',
  tags: ['Health'],
  summary: 'Readiness de la API',
  description: 'Valida dependencias operativas como cache, OTLP logs y Sentry. Retorna 503 si alguna dependencia crítica está caída.',
  responses: {
    200: {
      description: 'API lista para atender tráfico',
      content: { 'application/json': { schema: HealthReadyResponseSchema } },
    },
    503: {
      description: 'API no lista: una o más dependencias críticas están caídas',
      content: { 'application/json': { schema: HealthReadyResponseSchema } },
    },
  },
})
