import { createSysObjectAdapter } from '@/adapters'
import api from '@/interceptors/auth-token.interceptor'
import type { AxiosCall } from '@/models'
import type { FullSysObjectApiResponse } from '@/models/api'
import type { FullSysObject } from '@/models/sysobject'
import { loadAbort } from '@/utilities'

export const getSysObjectByNameService = (schema: string, name: string): AxiosCall<FullSysObject> => {
  const controller = loadAbort()

  const adapterCall = api
    .get<FullSysObjectApiResponse>('/sysobject/by-name', {
      params: { schema, name },
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
