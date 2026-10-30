import { useState } from 'react'
import { toast } from 'sonner'

import { NEUTRAL_TOAST_CLASS } from '@/components/ui/sonner'
import useFetchAndLoad from '@/hooks/useFetchAndLoad'
import type { ApiSysObjectType } from '@/models/sysobject'

import {
  FAVORITE_SCOPE_LABELS,
  type FavoriteScopeKind,
  type Favorito,
  scopeKindFrom,
  scopeRank,
  type UpsertFavoritoResponse,
} from '../models/favorito.model'
import { getFavoritosService, upsertFavoritoService } from '../services/favorito.service'

export const useFavoritos = (type: ApiSysObjectType) => {
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const { callEndpoint, loading } = useFetchAndLoad<Favorito[]>()
  const { callEndpoint: callUpsertEndpoint } = useFetchAndLoad<UpsertFavoritoResponse>()

  const getFavoritos = async () => {
    try {
      const response = await callEndpoint(getFavoritosService({ type, limit: 80 }))
      setFavoritos(response.data)
    } catch (err) {
      console.error('Error al obtener favoritos: ', err)
    }
  }

  const upsertFavorito = async (
    schema: string,
    objectName: string,
    objectType: string,
    isActive: boolean,
    scope: FavoriteScopeKind = 'global',
  ) => {
    try {
      const response = await callUpsertEndpoint(upsertFavoritoService({ schema, objectName, type: objectType, isActive, scope }))
      const favorito = response.data.data
      await getFavoritos()

      if (!favorito) {
        // El backend no escribió nada: ya estaba en el estado pedido. No es un error.
        toast(`${objectName} ya no estaba en favoritos · ${FAVORITE_SCOPE_LABELS[scope]}`, { className: NEUTRAL_TOAST_CLASS })
      } else if (favorito.isActive) {
        toast.success(`${objectName} agregado a favoritos · ${FAVORITE_SCOPE_LABELS[scope]}`)
      } else {
        // Neutro a propósito: quitar un favorito no es una advertencia.
        toast(`${objectName} eliminado de favoritos · ${FAVORITE_SCOPE_LABELS[scope]}`, { className: NEUTRAL_TOAST_CLASS })
      }
    } catch (err) {
      console.error('Error al registrar favorito: ', err)
      toast.error(`No se pudo actualizar ${objectName} en favoritos`)
    }
  }

  /** Quitar de favoritos es el mismo upsert con isActive en false. */
  const deleteFavorito = async (schema: string, objectName: string, objectType: string, scope: FavoriteScopeKind = 'global') =>
    upsertFavorito(schema, objectName, objectType, false, scope)

  /**
   * Entre los favoritos que coinciden en nombre y schema, devuelve el más específico
   * (database > server > global) usando `scopeRank`.
   */
  const isFavorito = (objectName: string, schema: string): Favorito | undefined => {
    const matches = favoritos.filter((f) => f.objectName === objectName && f.schema === schema)

    let best: Favorito | undefined
    for (const current of matches) {
      if (!best || scopeRank(current.scope) > scopeRank(best.scope)) best = current
    }
    return best
  }

  /** Favorito que coincide exactamente en objeto, schema y tipo de alcance. */
  const findFavorito = (objectName: string, schema: string, scopeKind: FavoriteScopeKind): Favorito | undefined =>
    favoritos.find((f) => f.objectName === objectName && f.schema === schema && scopeKindFrom(f.scope) === scopeKind)

  /**
   * Mueve un favorito a otro alcance. Primero asegura el destino (isActive true) y
   * recién entonces desactiva el origen, para no perder el favorito si falla el destino.
   */
  const moveFavorito = async (favorito: Favorito, toScope: FavoriteScopeKind): Promise<void> => {
    const currentScope = scopeKindFrom(favorito.scope)
    if (toScope === currentScope) return

    try {
      await callUpsertEndpoint(
        upsertFavoritoService({
          schema: favorito.schema,
          objectName: favorito.objectName,
          type: favorito.type,
          isActive: true,
          scope: toScope,
        }),
      )
      await callUpsertEndpoint(
        upsertFavoritoService({
          schema: favorito.schema,
          objectName: favorito.objectName,
          type: favorito.type,
          isActive: false,
          scope: currentScope,
        }),
      )
      await getFavoritos()
      toast.success(`${favorito.objectName} movido a favoritos · ${FAVORITE_SCOPE_LABELS[toScope]}`)
    } catch (err) {
      console.error('Error al mover favorito: ', err)
      toast.error(`No se pudo actualizar ${favorito.objectName} en favoritos`)
    }
  }

  return { favoritos, getFavoritos, upsertFavorito, deleteFavorito, isFavorito, findFavorito, moveFavorito, loading }
}
