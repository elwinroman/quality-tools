import api from '@/interceptors/auth-token.interceptor'
import type { AxiosCall } from '@/models'
import type { ApiSysObjectType } from '@/models/sysobject'
import { loadAbort } from '@/utilities'

import { favoritoAdapter } from '../adapters/favorito.adapter'
import type { Favorito, FavoritoApiResponse, UpsertFavoritoBody, UpsertFavoritoResponse } from '../models/favorito.model'

interface GetQueryParams {
  type: ApiSysObjectType
  limit: number
}

export const getFavoritosService = (queryParams: GetQueryParams): AxiosCall<Favorito[]> => {
  const controller = loadAbort()

  const adapterCall = api
    .get<FavoritoApiResponse>('/favorito', {
      signal: controller.signal,
      params: queryParams,
    })
    .then(async (response) => {
      return {
        ...response,
        data: favoritoAdapter(response.data),
      }
    })

  return {
    call: adapterCall,
    controller,
  }
}

export const upsertFavoritoService = (body: UpsertFavoritoBody): AxiosCall<UpsertFavoritoResponse> => {
  const controller = loadAbort()

  const call = api.put<UpsertFavoritoResponse>('/favorito', body, {
    signal: controller.signal,
  })

  return { call, controller }
}
