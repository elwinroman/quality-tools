import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFavoritos } from '@/components/favoritos/hooks/useFavoritos'
import type { FavoriteScope, Favorito } from '@/components/favoritos/models/favorito.model'
import { NEUTRAL_TOAST_CLASS } from '@/components/ui/sonner'

const mocks = vi.hoisted(() => ({
  callEndpoint: vi.fn(),
  getFavoritosService: vi.fn(),
  upsertFavoritoService: vi.fn(),
  // `toast` es invocable y además expone `success`/`error`; se replican ambas formas.
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

// El hook no debe tocar la red: se stubea el service y el fetcher.
vi.mock('@/hooks/useFetchAndLoad', () => ({
  default: () => ({ callEndpoint: mocks.callEndpoint, loading: false }),
}))

vi.mock('@/components/favoritos/services/favorito.service', () => ({
  getFavoritosService: mocks.getFavoritosService,
  upsertFavoritoService: mocks.upsertFavoritoService,
}))

vi.mock('sonner', () => ({ toast: mocks.toast }))

const GLOBAL: FavoriteScope = { serverName: null, databaseName: null }
const SERVER: FavoriteScope = { serverName: 'SRV_PROD', databaseName: null }
const DATABASE: FavoriteScope = { serverName: 'SRV_PROD', databaseName: 'RRHH' }

const makeFavorito = (id: number, scope: FavoriteScope): Favorito => ({
  id,
  schema: 'dbo',
  objectName: 'Clientes',
  type: 'V',
  date: '2026-01-01',
  objectId: id,
  scope,
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.callEndpoint.mockImplementation(async (axiosCall: { call: Promise<unknown> }) => axiosCall.call)
  mocks.getFavoritosService.mockReturnValue({ call: Promise.resolve({ data: [] }) })
  mocks.upsertFavoritoService.mockImplementation((body: { isActive: boolean }) => ({
    call: Promise.resolve({ data: { data: { isActive: body.isActive } } }),
  }))
})

describe('useFavoritos — scope', () => {
  it('upsertFavorito reenvía el scope indicado al servicio', async () => {
    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.upsertFavorito('dbo', 'Clientes', 'V', true, 'database')
    })

    expect(mocks.upsertFavoritoService).toHaveBeenCalledWith({
      schema: 'dbo',
      objectName: 'Clientes',
      type: 'V',
      isActive: true,
      scope: 'database',
    })
  })

  it('upsertFavorito usa global por defecto', async () => {
    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.upsertFavorito('dbo', 'Clientes', 'V', true)
    })

    expect(mocks.upsertFavoritoService).toHaveBeenCalledWith({
      schema: 'dbo',
      objectName: 'Clientes',
      type: 'V',
      isActive: true,
      scope: 'global',
    })
  })

  it('deleteFavorito reenvía el scope al servicio', async () => {
    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.deleteFavorito('dbo', 'Clientes', 'V', 'server')
    })

    expect(mocks.upsertFavoritoService).toHaveBeenCalledWith({
      schema: 'dbo',
      objectName: 'Clientes',
      type: 'V',
      isActive: false,
      scope: 'server',
    })
  })

  it('toastea el alta con el alcance', async () => {
    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.upsertFavorito('dbo', 'Clientes', 'V', true, 'database')
    })

    expect(mocks.toast.success).toHaveBeenCalledWith('Clientes agregado a favoritos · BD actual')
  })

  it('toastea la baja con el alcance, en estilo neutro', async () => {
    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.upsertFavorito('dbo', 'Clientes', 'V', false, 'database')
    })

    expect(mocks.toast).toHaveBeenCalledWith('Clientes eliminado de favoritos · BD actual', { className: NEUTRAL_TOAST_CLASS })
  })

  it('toastea el no-op (ya en el estado pedido) con el alcance, en estilo neutro', async () => {
    mocks.upsertFavoritoService.mockImplementationOnce(() => ({ call: Promise.resolve({ data: { data: null } }) }))

    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.upsertFavorito('dbo', 'Clientes', 'V', true, 'global')
    })

    expect(mocks.toast).toHaveBeenCalledWith('Clientes ya no estaba en favoritos · Global', { className: NEUTRAL_TOAST_CLASS })
  })

  it('mantiene el toast de error ante una falla del upsert', async () => {
    mocks.upsertFavoritoService.mockImplementationOnce(() => ({ call: Promise.reject(new Error('boom')) }))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.upsertFavorito('dbo', 'Clientes', 'V', true, 'global')
    })

    expect(mocks.toast.error).toHaveBeenCalledWith('No se pudo actualizar Clientes en favoritos')
    consoleError.mockRestore()
  })
})

describe('useFavoritos — isFavorito', () => {
  it('devuelve el favorito más específico (database > server > global)', async () => {
    mocks.getFavoritosService.mockReturnValue({
      call: Promise.resolve({ data: [makeFavorito(1, GLOBAL), makeFavorito(2, SERVER), makeFavorito(3, DATABASE)] }),
    })

    const { result } = renderHook(() => useFavoritos('V'))
    await act(async () => {
      await result.current.getFavoritos()
    })

    expect(result.current.isFavorito('Clientes', 'dbo')?.id).toBe(3)
  })

  it('ignora objetos que no coinciden en nombre o schema', async () => {
    mocks.getFavoritosService.mockReturnValue({
      call: Promise.resolve({ data: [makeFavorito(1, GLOBAL)] }),
    })

    const { result } = renderHook(() => useFavoritos('V'))
    await act(async () => {
      await result.current.getFavoritos()
    })

    expect(result.current.isFavorito('Otro', 'dbo')).toBeUndefined()
    expect(result.current.isFavorito('Clientes', 'otros')).toBeUndefined()
  })
})

describe('useFavoritos — moveFavorito', () => {
  it('hace upsert en el destino y luego desactiva el origen', async () => {
    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.moveFavorito(makeFavorito(1, GLOBAL), 'database')
    })

    const bodies = mocks.upsertFavoritoService.mock.calls.map((call) => call[0])
    expect(bodies).toEqual([
      { schema: 'dbo', objectName: 'Clientes', type: 'V', isActive: true, scope: 'database' },
      { schema: 'dbo', objectName: 'Clientes', type: 'V', isActive: false, scope: 'global' },
    ])
    expect(mocks.getFavoritosService).toHaveBeenCalledTimes(1)
  })

  it('no hace nada si el destino es el alcance actual', async () => {
    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.moveFavorito(makeFavorito(1, DATABASE), 'database')
    })

    expect(mocks.upsertFavoritoService).not.toHaveBeenCalled()
    expect(mocks.getFavoritosService).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('no toastea cuando el destino es el alcance actual', async () => {
    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.moveFavorito(makeFavorito(1, DATABASE), 'database')
    })

    expect(mocks.toast).not.toHaveBeenCalled()
    expect(mocks.toast.success).not.toHaveBeenCalled()
    expect(mocks.toast.error).not.toHaveBeenCalled()
  })

  it('toastea el movimiento con el alcance destino al completarse', async () => {
    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.moveFavorito(makeFavorito(1, GLOBAL), 'database')
    })

    expect(mocks.toast.success).toHaveBeenCalledWith('Clientes movido a favoritos · BD actual')
  })

  it('toastea el error si falla el movimiento', async () => {
    mocks.upsertFavoritoService.mockImplementationOnce(() => ({ call: Promise.reject(new Error('boom')) }))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useFavoritos('V'))

    await act(async () => {
      await result.current.moveFavorito(makeFavorito(1, GLOBAL), 'database')
    })

    expect(mocks.toast.error).toHaveBeenCalledWith('No se pudo actualizar Clientes en favoritos')
    consoleError.mockRestore()
  })
})
