import axios, { AxiosError, AxiosRequestConfig } from 'axios'

import { API_URL } from '@/enviroment/enviroment'
import { getAccessToken, setAccessToken } from '@/zustand/auth.store'

interface RetryAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
}

let refreshAccessTokenPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = axios
      .post(`${API_URL}/api/v1/auth/refresh-token`, {}, { withCredentials: true })
      .then((response) => {
        const newToken = response.data.data.accessToken
        setAccessToken(newToken)

        return newToken
      })
      .finally(() => {
        refreshAccessTokenPromise = null
      })
  }

  return refreshAccessTokenPromise
}

/**
 * Crea una instancia de Axios configurada para manejar peticiones HTTP
 * tanto para endpoints públicos como privados.
 * - Acepta Bearer token cuando está presente.
 * - Refresca el token automáticamente cuando es necesario.
 */

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)

  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryAxiosRequestConfig

    if (error.response?.status === 401 && !originalRequest._retry && !!getAccessToken()) {
      originalRequest._retry = true

      try {
        const newToken = await refreshAccessToken()

        // asegurarse que headers esté definido
        if (!originalRequest.headers) originalRequest.headers = {}

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`

        return api(originalRequest)
      } catch (err) {
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  },
)

export default api
