import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FavoritosNav } from '@/components/favoritos'
import type { FavoriteScope, Favorito } from '@/components/favoritos/models/favorito.model'

const GLOBAL: FavoriteScope = { serverName: null, databaseName: null }
const DATABASE: FavoriteScope = { serverName: 'SRV_PROD', databaseName: 'RRHH' }

const makeFavorito = (input: Partial<Favorito> & Pick<Favorito, 'id' | 'objectName'>): Favorito => ({
  schema: 'dbo',
  type: 'V',
  date: '2026-01-01',
  objectId: 1,
  scope: GLOBAL,
  ...input,
})

function renderNav(favoritos: Favorito[]) {
  const onDelete = vi.fn()
  const onSelect = vi.fn()
  const view = render(<FavoritosNav favoritos={favoritos} onDelete={onDelete} onSelect={onSelect} resetSignal={0} />)
  return { onDelete, onSelect, ...view }
}

/** Contenedor de la pantalla principal (entrada "Favoritos"). */
const mainPane = () => screen.getByTestId('favoritos-nav-main')
/** Contenedor de la pantalla de grupos. */
const listPane = () => screen.getByTestId('favoritos-nav-list')

/** Entrada única "Favoritos" de la pantalla principal. */
const entryButton = () => within(mainPane()).getByRole('button', { name: /^Favoritos/ })

/** Empuja la pantalla de favoritos desde la principal. */
const pushFavorites = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(entryButton())
}

describe('FavoritosNav — drill-down push/pop', () => {
  it('muestra la entrada Favoritos con contador y chevron, sin árbol inline', () => {
    renderNav([makeFavorito({ id: 1, objectName: 'ObjA' }), makeFavorito({ id: 2, objectName: 'ObjB' })])

    const entry = entryButton()
    expect(entry).toHaveTextContent('Favoritos')
    expect(entry).toHaveTextContent('2')
    expect(entry.querySelector('svg')).not.toBeNull()
    // Los grupos no están inline en la pantalla principal: viven detrás del push.
    expect(screen.queryByRole('button', { name: /Globales|BD actual/ })).not.toBeInTheDocument()
    expect(listPane()).toHaveAttribute('aria-hidden', 'true')
    // La pantalla inactiva sale del orden de tabulación con inert.
    expect(listPane()).toHaveAttribute('inert')
    expect(mainPane()).not.toHaveAttribute('inert')
  })

  it('no muestra el contador cuando no hay favoritos', () => {
    renderNav([])

    // La etiqueta sigue visible, pero el contador no se dibuja con 0.
    const entry = entryButton()
    expect(entry).toHaveTextContent('Favoritos')
    expect(within(entry).queryByText('0')).not.toBeInTheDocument()
  })

  it('empuja la pantalla de grupos: entrada fuera, cabecera atrás y grupos visibles', async () => {
    const user = userEvent.setup()
    renderNav([makeFavorito({ id: 1, objectName: 'ObjA', scope: DATABASE })])

    await pushFavorites(user)

    // La entrada queda fuera del árbol accesible; la cabecera atrás aparece.
    expect(within(mainPane()).queryByRole('button', { name: /^Favoritos/ })).not.toBeInTheDocument()
    expect(within(listPane()).getByRole('button', { name: 'Volver a Favoritos' })).toBeInTheDocument()
    expect(listPane()).not.toHaveAttribute('aria-hidden', 'true')
    // La pantalla activa recibe foco; la inactiva queda inert.
    expect(listPane()).not.toHaveAttribute('inert')
    expect(mainPane()).toHaveAttribute('inert')
    // Los grupos se renderizan como hijos de la pantalla.
    expect(within(listPane()).getByRole('button', { name: /BD actual/ })).toBeInTheDocument()
    expect(within(listPane()).getByText('ObjA')).toBeInTheDocument()
  })

  it('la cabecera atrás vuelve a la pantalla principal', async () => {
    const user = userEvent.setup()
    renderNav([makeFavorito({ id: 1, objectName: 'ObjA' })])

    await pushFavorites(user)
    await user.click(within(listPane()).getByRole('button', { name: 'Volver a Favoritos' }))

    expect(entryButton()).toBeInTheDocument()
    expect(listPane()).toHaveAttribute('aria-hidden', 'true')
    expect(listPane()).toHaveAttribute('inert')
    expect(mainPane()).not.toHaveAttribute('inert')
  })

  it('muestra el estado vacío en la pantalla de grupos', async () => {
    const user = userEvent.setup()
    renderNav([])

    await pushFavorites(user)

    expect(within(listPane()).getByText('Sin favoritos aún')).toBeInTheDocument()
  })

  it('vuelve a la pantalla principal cuando cambia resetSignal', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const onSelect = vi.fn()
    const { rerender } = render(
      <FavoritosNav favoritos={[makeFavorito({ id: 1, objectName: 'ObjA' })]} onDelete={onDelete} onSelect={onSelect} resetSignal={0} />,
    )

    await pushFavorites(user)
    expect(within(listPane()).getByRole('button', { name: 'Volver a Favoritos' })).toBeInTheDocument()

    rerender(
      <FavoritosNav favoritos={[makeFavorito({ id: 1, objectName: 'ObjA' })]} onDelete={onDelete} onSelect={onSelect} resetSignal={1} />,
    )

    expect(entryButton()).toBeInTheDocument()
    expect(listPane()).toHaveAttribute('aria-hidden', 'true')
    expect(listPane()).toHaveAttribute('inert')
    expect(mainPane()).not.toHaveAttribute('inert')
  })
})
