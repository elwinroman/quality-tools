import { describe, expect, it, vi } from 'vitest'

const { verifyTokenMiddleware, controllerRun } = vi.hoisted(() => ({
  verifyTokenMiddleware: vi.fn(),
  controllerRun: vi.fn(),
}))

vi.mock('@core/middlewares', () => ({ verifyTokenMiddleware }))
vi.mock('@/modules/performance/infrastructure/adapters/drivers/http/composition-root', () => ({
  getQueryStoreOptionsController: { run: controllerRun },
}))

import { performanceRouter } from '@/modules/performance/infrastructure/adapters/drivers/http/performance.router'

interface RouteStackEntry {
  method: string
  handle: unknown
}

interface RouteLayer {
  route?: { path: string; stack: RouteStackEntry[] }
}

function readStack(router: unknown): RouteLayer[] {
  return (router as unknown as { stack: RouteLayer[] }).stack
}

describe('performanceRouter', () => {
  it('registers the Query Store options route with verifyTokenMiddleware first', () => {
    const router = performanceRouter()

    expect(typeof router).toBe('function')
    expect(Array.isArray(readStack(router))).toBe(true)

    const layer = readStack(router).find(candidate => candidate.route?.path === '/query-store/options')
    expect(layer?.route).toBeDefined()

    const getHandlers = layer!.route!.stack.filter(entry => entry.method === 'get')
    expect(getHandlers).toHaveLength(2)
    expect(getHandlers[0].handle).toBe(verifyTokenMiddleware)
    expect(typeof getHandlers[1].handle).toBe('function')
  })
})
