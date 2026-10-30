import api from '@/interceptors/auth-token.interceptor'
import type { AxiosCall } from '@/models'
import type { SysObjectRelationsApiResponse } from '@/models/api'
import type { SysObjectRelation } from '@/models/sysobject'
import { loadAbort } from '@/utilities'

/** Obtiene los objetos que el objeto dado utiliza (dependencias). */
export const getSysObjectDependenciesService = (schema: string, name: string): AxiosCall<SysObjectRelation[]> => {
  const controller = loadAbort()

  const call = api
    .get<SysObjectRelationsApiResponse>('/sysobject/dependencies', {
      params: { schema, name },
      signal: controller.signal,
    })
    .then((response) => ({
      ...response,
      data: response.data.data,
    }))

  return {
    call,
    controller,
  }
}

/** Obtiene los objetos que utilizan al objeto dado (referencias). */
export const getSysObjectDependentsService = (schema: string, name: string): AxiosCall<SysObjectRelation[]> => {
  const controller = loadAbort()

  const call = api
    .get<SysObjectRelationsApiResponse>('/sysobject/references', {
      params: { schema, name },
      signal: controller.signal,
    })
    .then((response) => ({
      ...response,
      data: response.data.data,
    }))

  return {
    call,
    controller,
  }
}
