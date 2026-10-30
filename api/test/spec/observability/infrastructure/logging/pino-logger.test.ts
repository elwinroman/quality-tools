import { PinoLogger } from '@observability/infrastructure/logging/pino/pino-logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { buildLogContext, debug, error, isLevelEnabled, pinoFactory } = vi.hoisted(() => ({
  buildLogContext: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  isLevelEnabled: vi.fn(),
  pinoFactory: vi.fn(),
}))

vi.mock('pino', () => ({ default: pinoFactory }))
vi.mock('@observability/infrastructure/logging/log-attributes.mapper', () => ({ buildLogContext }))
vi.mock('@/config/enviroment', () => ({ CONSOLE_LOG_LEVEL: 'error', NODE_ENV: 'production' }))

describe('PinoLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isLevelEnabled.mockImplementation(level => level === 'error')
    pinoFactory.mockReturnValue({ debug, error, isLevelEnabled })
    buildLogContext.mockReturnValue({ correlationId: 'correlation-id' })
  })

  it('debería omitir el contexto bajo el nivel configurado y emitir los errores aceptados', () => {
    const logger = new PinoLogger()

    logger.debug('filtered', { expensive: true })

    expect(buildLogContext).not.toHaveBeenCalled()
    expect(debug).not.toHaveBeenCalled()

    logger.error('accepted', { action: 'save' })

    expect(buildLogContext).toHaveBeenCalledOnce()
    expect(buildLogContext).toHaveBeenCalledWith({ action: 'save' })
    expect(error).toHaveBeenCalledWith({ message: 'accepted', correlationId: 'correlation-id' })
    expect(pinoFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        transport: { targets: [{ target: 'pino/file', options: { destination: 1 }, level: 'error' }] },
      }),
    )
  })
})
