import { checkSessionAdapter, CheckSessionResponse, createAuthenticatedUserAdapter } from '@/adapters'
import api from '@/interceptors/auth-token.interceptor'
import { AxiosCall, Credential } from '@/models'
import { AuthenticatedUserApiResponse, CheckSessionApiResponse, ListDatabasesApiResponse, SwitchDatabaseApiResponse } from '@/models/api'
import { AuthenticatedUser } from '@/models/auth'
import { loadAbort } from '@/utilities'

export const loginService = (credential: Credential): AxiosCall<AuthenticatedUser> => {
  const controller = loadAbort()

  const adapterCredential = {
    host: credential.server,
    database: credential.dbname,
    user: credential.username,
    password: credential.password,
  }

  const adapterCall = api
    .post<AuthenticatedUserApiResponse>('/auth/login', adapterCredential, {
      signal: controller.signal,
      withCredentials: true,
    })
    .then((response) => {
      return {
        ...response,
        data: createAuthenticatedUserAdapter(response.data),
      }
    })

  return {
    call: adapterCall,
    controller,
  }
}

export const listDatabasesService = (credentials: Omit<Credential, 'dbname'>): AxiosCall<string[]> => {
  const controller = loadAbort()

  const adapterCredential = {
    host: credentials.server,
    user: credentials.username,
    password: credentials.password,
  }

  const adapterCall = api
    .post<ListDatabasesApiResponse>('/auth/databases', adapterCredential, {
      signal: controller.signal,
    })
    .then((response) => ({
      ...response,
      data: response.data.data,
    }))

  return {
    call: adapterCall,
    controller,
  }
}

export const logoutService = (): AxiosCall<void> => {
  const controller = loadAbort()

  return {
    call: api.post(
      '/auth/logout',
      {}, // body vacío
      {
        signal: controller.signal,
        withCredentials: true, // true: para enviar la cookie en el payload
      },
    ),
    controller,
  }
}

export const listDatabasesAuthenticatedService = (): AxiosCall<string[]> => {
  const controller = loadAbort()

  const adapterCall = api.post<ListDatabasesApiResponse>('/auth/databases', {}, { signal: controller.signal }).then((response) => ({
    ...response,
    data: response.data.data,
  }))

  return { call: adapterCall, controller }
}

export const switchDatabaseService = (database: string): AxiosCall<string> => {
  const controller = loadAbort()

  // retorna el nombre que el servidor dejó como base de datos activa (puede diferir del solicitado)
  const adapterCall = api
    .patch<SwitchDatabaseApiResponse>('/auth/switch-database', { database }, { signal: controller.signal })
    .then((response) => ({
      ...response,
      data: response.data.data.name,
    }))

  return {
    call: adapterCall,
    controller,
  }
}

export const checkSessionService = (): AxiosCall<CheckSessionResponse> => {
  const controller = loadAbort()

  const adapterCall = api
    .get<CheckSessionApiResponse>('/auth/check-session', {
      signal: controller.signal,
    })
    .then((response) => {
      return {
        ...response,
        data: checkSessionAdapter(response.data),
      }
    })

  return {
    call: adapterCall,
    controller,
  }
}
