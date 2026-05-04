/**
 * Representa la estructura de respuesta enviada por la API
 * al autenticar a un usuario. Contiene información del usuario,
 * detalles de la BD y el token de acceso.
 */
export interface AuthenticatedUserApiResponse {
  correlationId: string
  data: {
    id: number
    user: string
    aliasHost: string
    storeDetails: {
      name: string
      compatibility: number
      description: string
      server: string
      prodDatabase: string
      date: Date | string
      viewDefinitionPermission: boolean
    }
    accessToken: string
  }
}
