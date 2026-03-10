import { AxiosResponse, isAxiosError, isCancel } from 'axios'
import { useEffect, useState } from 'react'

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

  let controller: AbortController

  const callEndpoint = async (axiosCall: AxiosCall<T>) => {
    if (axiosCall.controller) controller = axiosCall.controller
    setLoading(true)
    setError(null)

    let result = {} as AxiosResponse<T>
    try {
      result = await axiosCall.call // ejecuta la llamada a la API
    } catch (err) {
      // request cancelada (cambio de tab, desmontaje) → ignorar silenciosamente
      if (isCancel(err)) return result

      setLoading(false)

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

          setError({
            title: errorTitle,
            detail: errorDetail,
          })
        } else {
          updateErrorApiConnection(true) // error de conexión

          setError({
            title: 'Error de red',
            detail: 'No se pudo conectar al servidor o el servidor no está disponible.',
          })
        }
      } else {
        setError({
          title: 'Error desconocido',
          detail: 'Ocurrió un error inesperado. Vuelva a intentarlo.',
        })
      }

      throw err // se lanza el error
    }
    setLoading(false)
    return result
  }

  const cancelEndpoint = () => {
    setLoading(false)
    setError(null)
    if (controller) controller.abort() // cancela la solicitud pendiente
  }

  // cleanup automático cuando el componente se desmonta
  useEffect(() => {
    return () => {
      cancelEndpoint()
    }
  }, [])

  return { callEndpoint, loading, error }
}

export default useFetchAndLoad
