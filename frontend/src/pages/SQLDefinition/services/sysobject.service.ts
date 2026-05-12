import { createSysObjectAdapter } from '@/adapters'
import api from '@/interceptors/auth-token.interceptor'
import type { AxiosCall } from '@/models'
import type { FullSysObjectApiResponse } from '@/models/api'
import type { FullSysObject } from '@/models/sysobject'
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
