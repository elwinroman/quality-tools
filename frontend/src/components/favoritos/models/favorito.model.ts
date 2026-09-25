import type { BaseSysObjectType } from '@/models/sysobject'

export interface Favorito {
  id: number
  schema: string
  objectName: string
  type: BaseSysObjectType
  date: string | Date
  objectId: number | null
}

export interface FavoritoApiResponse {
  correlationId: string
  meta: { total: number }
  data: Favorito[]
}

export interface UpsertFavoritoBody {
  schema: string
  objectName: string
  type: string
  /** true lo marca como favorito; false lo quita. El backend lo exige. */
  isActive: boolean
}

/**
 * Resultado de la escritura. El front solo consume `isActive` para elegir el mensaje;
 * `data: null` significa que no se escribió nada (ya estaba en el estado pedido).
 */
export interface FavoritoWriteResult {
  isActive: boolean
}

export interface UpsertFavoritoResponse {
  correlationId: string
  message: string
  data: FavoritoWriteResult | null
}
