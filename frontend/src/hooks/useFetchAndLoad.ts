import { AxiosResponse, isAxiosError, isCancel } from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'

import { AxiosCall } from '@/models'
import { useAuthStore } from '@/zustand'

/**
 * Hook personalizado para manejar llamadas HTTP con Axios
 * Incluye control de estado de carga (`loading`) y posibilidad de cancelar peticiones
 */
const useFetchAndLoad = <T = unknown>() => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ title: string; detail: string } | null>(null)

  const updateErrorApiConnection = useAuthStore((state) => state.updateErrorApiConnection)
  const controllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const pendingRequestsRef = useRef(0)

  const callEndpoint = useCallback(
    async (axiosCall: AxiosCall<T>) => {
      if (axiosCall.controller) controllerRef.current = axiosCall.controller
      pendingRequestsRef.current += 1

      if (mountedRef.current) {
        setLoading(true)
        setError(null)
      }

      let result = {} as AxiosResponse<T>
      try {
        result = await axiosCall.call // ejecuta la llamada a la API
      } catch (err) {
        // request cancelada (cambio de tab, desmontaje) → ignorar silenciosamente
        if (isCancel(err)) return result

        // manejo del error
        if (isAxiosError(err)) {
          if (err.response) {
            const { data } = err.response

            // extrae el título y el detalle del error
            let errorTitle = data.error?.title ?? 'Error desconocido'
            let errorDetail = data.error?.detail ?? 'Error desconocido'

            // error de ruta no encontrada
            if (data.error?.type === 'RouteNotFoundException') {
              errorTitle = 'Error interno del sistema'
              errorDetail = 'Ha ocurrido un error inesperado. Intente nuevamente más tarde o contacte con soporte si el problema persiste.'
            }

            if (mountedRef.current) {
              setError({
                title: errorTitle,
                detail: errorDetail,
              })
            }
          } else {
            updateErrorApiConnection(true) // error de conexión

            if (mountedRef.current) {
              setError({
                title: 'Error de red',
                detail: 'No se pudo conectar al servidor o el servidor no está disponible.',
              })
            }
          }
        } else {
          if (mountedRef.current) {
            setError({
              title: 'Error desconocido',
              detail: 'Ocurrió un error inesperado. Vuelva a intentarlo.',
            })
          }
        }

        throw err // se lanza el error
      } finally {
        pendingRequestsRef.current = Math.max(0, pendingRequestsRef.current - 1)
        if (mountedRef.current) setLoading(pendingRequestsRef.current > 0)
      }

      return result
    },
    [updateErrorApiConnection],
  )

  const cancelEndpoint = useCallback(() => {
    pendingRequestsRef.current = 0
    if (mountedRef.current) {
      setLoading(false)
      setError(null)
    }
    controllerRef.current?.abort() // cancela la solicitud pendiente
    controllerRef.current = null
  }, [])

  // cleanup automático cuando el componente se desmonta
  useEffect(() => {
    return () => {
      mountedRef.current = false
      cancelEndpoint()
    }
  }, [cancelEndpoint])

  return { callEndpoint, cancelEndpoint, loading, error }
}

export default useFetchAndLoad
