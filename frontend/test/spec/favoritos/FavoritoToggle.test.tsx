import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FavoritoToggle } from '@/components/favoritos/components/FavoritoToggle'
import { FavoritoProvider } from '@/components/favoritos/contexts/favoritoContext'
import type { FavoriteScope, Favorito } from '@/components/favoritos/models/favorito.model'

const mocks = vi.hoisted(() => ({
  callEndpoint: vi.fn(),
  getFavoritosService: vi.fn(),
  upsertFavoritoService: vi.fn(),
}))

// El componente no debe tocar la red: se stubea el service y el fetcher.
vi.mock('@/hooks/useFetchAndLoad', () => ({
  default: () => ({ callEndpoint: mocks.callEndpoint, loading: false }),
}))

vi.mock('@/components/favoritos/services/favorito.service', () => ({
  getFavoritosService: mocks.getFavoritosService,
  upsertFavoritoService: mocks.upsertFavoritoService,
}))

const GLOBAL: FavoriteScope = { serverName: null, databaseName: null }
const SERVER: FavoriteScope = { serverName: 'SRV_PROD', databaseName: null }
const DATABASE: FavoriteScope = { serverName: 'SRV_PROD', databaseName: 'RRHH' }

const OBJECT = { schemaName: 'dbo', name: 'Clientes', type: 'V' }

const makeFavorito = (id: number, scope: FavoriteScope): Favorito => ({
  id,
  schema: 'dbo',
  objectName: 'Clientes',
  type: 'V',
  date: '2026-01-01',
  objectId: id,
  scope,
})

/** Cuerpos enviados al servicio de upsert, en orden. */
const upsertBodies = () => mocks.upsertFavoritoService.mock.calls.map((call) => call[0])

function setFavoritos(favoritos: Favorito[]) {
  mocks.getFavoritosService.mockReturnValue({ call: Promise.resolve({ data: favoritos }) })
}

function renderToggle() {
  return render(
    <FavoritoProvider type="V">
      <FavoritoToggle object={OBJECT} />
    </FavoritoProvider>,
  )
}

/** El segmento se identifica por la etiqueta de su alcance. */
const segment = (label: 'Global' | 'BD actual') => screen.getByRole('button', { name: label })

/** Segmentos con aria-pressed activo: nunca debe haber más de uno. */
const pressedSegments = () => screen.getAllByRole('button').filter((button) => button.getAttribute('aria-pressed') === 'true')

beforeEach(() => {
  vi.clearAllMocks()
  mocks.callEndpoint.mockImplementation(async (axiosCall: { call: Promise<unknown> }) => axiosCall.call)
  mocks.upsertFavoritoService.mockImplementation((body: { isActive: boolean }) => ({
    call: Promise.resolve({ data: { data: { isActive: body.isActive } } }),
  }))
  setFavoritos([])
})

describe('FavoritoToggle — control segmentado', () => {
  it('muestra siempre los dos segmentos como iconos accesibles, sin texto visible', async () => {
    renderToggle()

    expect(await screen.findByRole('button', { name: 'Global' })).toBeInTheDocument()
    expect(segment('BD actual')).toBeInTheDocument()
    // El nombre accesible viene del aria-label: no queda ninguna etiqueta de texto visible.
    expect(screen.queryByText('Global')).not.toBeInTheDocument()
    expect(screen.queryByText('BD actual')).not.toBeInTheDocument()
  })

  it('sin favorito deja ambos segmentos inactivos', async () => {
    renderToggle()

    expect(await screen.findByRole('button', { name: 'Global' })).toBeInTheDocument()
    expect(segment('Global')).toHaveAttribute('aria-pressed', 'false')
    expect(segment('BD actual')).toHaveAttribute('aria-pressed', 'false')
    expect(pressedSegments()).toHaveLength(0)
  })

  it('anuncia la acción de agregar y el alcance en el tooltip de un segmento inactivo', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.hover(segment('Global'))

    // Radix renderiza el contenido con role="tooltip" al abrirlo.
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Agregar a favoritos (Global)')
  })

  it('anuncia la acción de quitar y el alcance en el tooltip del segmento activo', async () => {
    setFavoritos([makeFavorito(1, GLOBAL)])
    const user = userEvent.setup()
    renderToggle()

    await waitFor(() => expect(segment('Global')).toHaveAttribute('aria-pressed', 'true'))
    await user.hover(segment('Global'))

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Quitar de favoritos (Global)')
  })

  it('nombra el alcance de la base en el tooltip de su segmento', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.hover(segment('BD actual'))

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Agregar a favoritos (BD actual)')
  })

  it('refleja en aria-pressed únicamente el alcance con favorito', async () => {
    setFavoritos([makeFavorito(1, GLOBAL)])
    renderToggle()

    await waitFor(() => expect(segment('Global')).toHaveAttribute('aria-pressed', 'true'))
    expect(segment('BD actual')).toHaveAttribute('aria-pressed', 'false')
    expect(pressedSegments()).toHaveLength(1)
  })

  it('con global y base a la vez, deja activo solo el alcance visible más específico', async () => {
    setFavoritos([makeFavorito(1, GLOBAL), makeFavorito(2, DATABASE)])
    renderToggle()

    await waitFor(() => expect(segment('BD actual')).toHaveAttribute('aria-pressed', 'true'))
    expect(segment('Global')).toHaveAttribute('aria-pressed', 'false')
    expect(pressedSegments()).toHaveLength(1)
  })

  it('agrega en la base al tocar el segmento inactivo cuando el objeto no es favorito', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(segment('BD actual'))

    await waitFor(() => expect(mocks.upsertFavoritoService).toHaveBeenCalledTimes(1))
    expect(upsertBodies()).toEqual([{ schema: 'dbo', objectName: 'Clientes', type: 'V', isActive: true, scope: 'database' }])
  })

  it('agrega en global al tocar el segmento inactivo cuando el objeto no es favorito', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(segment('Global'))

    await waitFor(() => expect(mocks.upsertFavoritoService).toHaveBeenCalledTimes(1))
    expect(upsertBodies()).toEqual([{ schema: 'dbo', objectName: 'Clientes', type: 'V', isActive: true, scope: 'global' }])
  })

  it('mueve de global a la base al tocar el segmento inactivo', async () => {
    setFavoritos([makeFavorito(1, GLOBAL)])
    const user = userEvent.setup()
    renderToggle()

    await waitFor(() => expect(segment('Global')).toHaveAttribute('aria-pressed', 'true'))
    await user.click(segment('BD actual'))

    // moveFavorito asegura el destino y recién después desactiva el origen.
    await waitFor(() => expect(mocks.upsertFavoritoService).toHaveBeenCalledTimes(2))
    expect(upsertBodies()).toEqual([
      { schema: 'dbo', objectName: 'Clientes', type: 'V', isActive: true, scope: 'database' },
      { schema: 'dbo', objectName: 'Clientes', type: 'V', isActive: false, scope: 'global' },
    ])
    expect(pressedSegments()).toHaveLength(1)
  })

  it('mueve de la base a global al tocar el segmento inactivo', async () => {
    setFavoritos([makeFavorito(1, DATABASE)])
    const user = userEvent.setup()
    renderToggle()

    await waitFor(() => expect(segment('BD actual')).toHaveAttribute('aria-pressed', 'true'))
    await user.click(segment('Global'))

    await waitFor(() => expect(mocks.upsertFavoritoService).toHaveBeenCalledTimes(2))
    expect(upsertBodies()).toEqual([
      { schema: 'dbo', objectName: 'Clientes', type: 'V', isActive: true, scope: 'global' },
      { schema: 'dbo', objectName: 'Clientes', type: 'V', isActive: false, scope: 'database' },
    ])
    expect(pressedSegments()).toHaveLength(1)
  })

  it('ignora un favorito de servidor al elegir el origen del movimiento', async () => {
    // El alcance `server` no tiene segmento: no debe mostrarse activo ni ser el origen.
    setFavoritos([makeFavorito(1, SERVER), makeFavorito(2, GLOBAL)])
    const user = userEvent.setup()
    renderToggle()

    await waitFor(() => expect(segment('Global')).toHaveAttribute('aria-pressed', 'true'))
    expect(segment('BD actual')).toHaveAttribute('aria-pressed', 'false')
    expect(pressedSegments()).toHaveLength(1)

    await user.click(segment('BD actual'))

    await waitFor(() => expect(mocks.upsertFavoritoService).toHaveBeenCalledTimes(2))
    expect(upsertBodies()).toEqual([
      { schema: 'dbo', objectName: 'Clientes', type: 'V', isActive: true, scope: 'database' },
      { schema: 'dbo', objectName: 'Clientes', type: 'V', isActive: false, scope: 'global' },
    ])
    expect(pressedSegments()).toHaveLength(1)
  })

  it('quita el favorito al tocar el segmento activo', async () => {
    setFavoritos([makeFavorito(1, DATABASE)])
    const user = userEvent.setup()
    renderToggle()

    await waitFor(() => expect(segment('BD actual')).toHaveAttribute('aria-pressed', 'true'))
    await user.click(segment('BD actual'))

    await waitFor(() => expect(mocks.upsertFavoritoService).toHaveBeenCalledTimes(1))
    expect(upsertBodies()).toEqual([{ schema: 'dbo', objectName: 'Clientes', type: 'V', isActive: false, scope: 'database' }])
    expect(pressedSegments()).toHaveLength(1)
  })
})
