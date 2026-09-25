import { useState } from 'react'
import { toast } from 'sonner'

import { NEUTRAL_TOAST_CLASS } from '@/components/ui/sonner'
import useFetchAndLoad from '@/hooks/useFetchAndLoad'
import type { ApiSysObjectType } from '@/models/sysobject'

import type { Favorito, UpsertFavoritoResponse } from '../models/favorito.model'
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

  const upsertFavorito = async (schema: string, objectName: string, objectType: string, isActive: boolean) => {
    try {
      const response = await callUpsertEndpoint(upsertFavoritoService({ schema, objectName, type: objectType, isActive }))
      const favorito = response.data.data
      await getFavoritos()

      if (!favorito) {
        // El backend no escribió nada: ya estaba en el estado pedido. No es un error.
        toast(`${objectName} ya no estaba en favoritos`, { className: NEUTRAL_TOAST_CLASS })
      } else if (favorito.isActive) {
        toast.success(`${objectName} agregado a favoritos`)
      } else {
        // Neutro a propósito: quitar un favorito no es una advertencia.
        toast(`${objectName} eliminado de favoritos`, { className: NEUTRAL_TOAST_CLASS })
      }
    } catch (err) {
      console.error('Error al registrar favorito: ', err)
      toast.error(`No se pudo actualizar ${objectName} en favoritos`)
    }
  }

  /** Quitar de favoritos es el mismo upsert con isActive en false. */
  const deleteFavorito = async (schema: string, objectName: string, objectType: string) =>
    upsertFavorito(schema, objectName, objectType, false)

  const isFavorito = (objectName: string, schema: string): Favorito | undefined => {
    return favoritos.find((f) => f.objectName === objectName && f.schema === schema)
  }

  return { favoritos, getFavoritos, upsertFavorito, deleteFavorito, isFavorito, loading }
}
