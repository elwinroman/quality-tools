import { createSysObjectAdapter } from '@/adapters'
import api from '@/interceptors/auth-token.interceptor'
import type { AxiosCall } from '@/models'
import type { FullSysObjectApiResponse, SysObjectRelationsApiResponse } from '@/models/api'
import type { FullSysObject, SysObjectRelation } from '@/models/sysobject'
import { loadAbort } from '@/utilities'

/** Obtiene un objeto de tipo SQL Definition por ID */
export const getSysObjectByIdService = (id: number): AxiosCall<FullSysObject> => {
  const controller = loadAbort()

  const adapterCall = api
    .get<FullSysObjectApiResponse>(`/sysobject/${id}`, {
      signal: controller.signal,
    })
    .then((response) => ({
      ...response,
      data: createSysObjectAdapter(response.data),
    }))

  return {
    call: adapterCall,
    controller,
  }
}

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
