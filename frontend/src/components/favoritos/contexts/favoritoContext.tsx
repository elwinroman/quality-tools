import { createContext, type ReactNode, useContext, useEffect } from 'react'

import type { ApiSysObjectType } from '@/models/sysobject'
import { useAuthStore } from '@/zustand'

import { useFavoritos } from '../hooks/useFavoritos'
import type { Favorito } from '../models/favorito.model'

interface FavoritoContextType {
  favoritos: Favorito[]
  getFavoritos(): Promise<void>
  upsertFavorito(schema: string, objectName: string, type: string, isActive: boolean): Promise<void>
  deleteFavorito(schema: string, objectName: string, type: string): Promise<void>
  isFavorito(objectName: string, schema: string): Favorito | undefined
  loading: boolean
}

const FavoritoContext = createContext<FavoritoContextType | null>(null)

interface Props {
  children: ReactNode
  type: ApiSysObjectType
}

export function FavoritoProvider({ children, type }: Props) {
  const { favoritos, getFavoritos, upsertFavorito, deleteFavorito, isFavorito, loading } = useFavoritos(type)
  const database = useAuthStore((state) => state.authContext?.database)

  useEffect(() => {
    getFavoritos()
  }, [database])

  return (
    <FavoritoContext.Provider value={{ favoritos, getFavoritos, upsertFavorito, deleteFavorito, isFavorito, loading }}>
      {children}
    </FavoritoContext.Provider>
  )
}

export const useFavoritoContext = () => {
  const context = useContext(FavoritoContext)
  if (!context) throw new Error('useFavoritoContext debe usarse dentro de <FavoritoProvider>')

  return context
}

/** Versión segura: retorna null si no hay provider (para componentes compartidos) */
export const useFavoritoContextSafe = () => {
  return useContext(FavoritoContext)
}
