import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FavoritosList } from '@/components/favoritos'
import type { FavoriteScope, Favorito } from '@/components/favoritos/models/favorito.model'

const GLOBAL: FavoriteScope = { serverName: null, databaseName: null }
const SERVER: FavoriteScope = { serverName: 'SRV_PROD', databaseName: null }
const DATABASE: FavoriteScope = {
  serverName: 'SRV_PROD',
  databaseName: 'RRHH',
}

const makeFavorito = (input: Partial<Favorito> & Pick<Favorito, 'id' | 'objectName'>): Favorito => ({
  schema: 'dbo',
  type: 'V',
  date: '2026-01-01',
  objectId: 1,
  scope: GLOBAL,
  ...input,
})

function renderList(favoritos: Favorito[]) {
  const onDelete = vi.fn()
  const onSelect = vi.fn()
  render(<FavoritosList favoritos={favoritos} onDelete={onDelete} onSelect={onSelect} />)
  return { onDelete, onSelect }
}

/** Devuelve el `<li>` del grupo cuyo encabezado coincide con la etiqueta. */
const groupOf = (label: RegExp) => screen.getByRole('button', { name: label }).closest('li') as HTMLElement

describe('FavoritosList — agrupación por alcance', () => {
  it('muestra el estado vacío cuando no hay favoritos', () => {
    renderList([])

    expect(screen.getByText('Sin favoritos aún')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Globales|Servidor|BD actual/ })).not.toBeInTheDocument()
  })

  it('renderiza solo los grupos con ítems, en orden, con etiqueta, contexto y contador', () => {
    renderList([
      makeFavorito({ id: 1, objectName: 'GlobalA', scope: GLOBAL }),
      makeFavorito({ id: 2, objectName: 'GlobalB', scope: GLOBAL }),
      makeFavorito({ id: 3, objectName: 'DbA', scope: DATABASE }),
    ])

    const globalHeader = screen.getByRole('button', { name: /Globales/ })
    const dbHeader = screen.getByRole('button', { name: /BD actual/ })

    expect(globalHeader).toHaveTextContent('2')
    expect(dbHeader).toHaveTextContent('1')

    // El grupo de servidor no tiene ítems: se omite.
    expect(screen.queryByRole('button', { name: /Servidor/ })).not.toBeInTheDocument()
    // Global se dibuja antes que base actual.
    expect(globalHeader.compareDocumentPosition(dbHeader) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('coloca cada ítem en el grupo de su alcance', () => {
    renderList([
      makeFavorito({ id: 1, objectName: 'ObjGlobal', scope: GLOBAL }),
      makeFavorito({ id: 2, objectName: 'ObjServidor', scope: SERVER }),
      makeFavorito({ id: 3, objectName: 'ObjBase', scope: DATABASE }),
    ])

    const globalGroup = groupOf(/Globales/)
    const serverGroup = groupOf(/^Servidor · /)
    const dbGroup = groupOf(/BD actual/)

    expect(within(globalGroup).getByText('ObjGlobal')).toBeInTheDocument()
    expect(within(globalGroup).queryByText('ObjServidor')).not.toBeInTheDocument()
    expect(within(serverGroup).getByText('ObjServidor')).toBeInTheDocument()
    expect(within(serverGroup).getByText(/SRV_PROD/)).toBeInTheDocument()
    expect(within(dbGroup).getByText('ObjBase')).toBeInTheDocument()
  })

  it('elimina un favorito reenviando su alcance', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderList([makeFavorito({ id: 3, objectName: 'ObjBase', scope: DATABASE })])

    await user.click(within(groupOf(/BD actual/)).getByTitle('Quitar de favoritos'))

    expect(onDelete).toHaveBeenCalledWith('dbo', 'ObjBase', 'V', 'database')
  })

  it('mantiene la selección y el estado deshabilitado de los ítems', async () => {
    const user = userEvent.setup()
    const { onSelect } = renderList([
      makeFavorito({
        id: 1,
        objectName: 'Disponible',
        scope: GLOBAL,
        objectId: 10,
      }),
      makeFavorito({
        id: 2,
        objectName: 'NoDisponible',
        scope: GLOBAL,
        objectId: null,
      }),
    ])

    await user.click(screen.getByRole('button', { name: 'Disponible' }))
    expect(onSelect).toHaveBeenCalledWith('dbo', 'Disponible')
    expect(screen.getByRole('button', { name: /NoDisponible/ })).toBeDisabled()
  })
})
