import api from '@/interceptors/auth-token.interceptor'
import type { AxiosCall } from '@/models'
import { loadAbort } from '@/utilities'

import type { UserTableApiResponse } from '../models/usertable.model'

/** Obtiene la información de un usertable por esquema y nombre */
export const getUserTableByNameService = (schema: string, name: string): AxiosCall<UserTableApiResponse> => {
  const controller = loadAbort()

  const call = api.get<UserTableApiResponse>('/sysobject/usertable/by-name', {
    params: { schema, name },
    signal: controller.signal,
  })

  return { call, controller }
}
