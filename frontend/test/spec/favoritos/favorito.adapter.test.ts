import { describe, expect, it } from 'vitest'

import { favoritoAdapter } from '@/components/favoritos/adapters/favorito.adapter'
import type { FavoritoApiResponse } from '@/components/favoritos/models/favorito.model'

const baseItem = {
  id: 1,
  schema: 'dbo',
  objectName: 'Clientes',
  type: 'V' as const,
  date: '2026-01-01',
  objectId: 10,
}

describe('favoritoAdapter', () => {
  it('mapea el scope cuando la API lo devuelve', () => {
    const response: FavoritoApiResponse = {
      correlationId: 'c1',
      meta: { total: 1 },
      data: [{ ...baseItem, scope: { serverName: 'SRV_PROD', databaseName: 'RRHH' } }],
    }

    const [favorito] = favoritoAdapter(response)

    expect(favorito.scope).toEqual({ serverName: 'SRV_PROD', databaseName: 'RRHH' })
  })

  it('usa scope global por defecto cuando la API lo omite', () => {
    const response: FavoritoApiResponse = {
      correlationId: 'c1',
      meta: { total: 1 },
      data: [{ ...baseItem }],
    }

    const [favorito] = favoritoAdapter(response)

    expect(favorito.scope).toEqual({ serverName: null, databaseName: null })
  })
})
