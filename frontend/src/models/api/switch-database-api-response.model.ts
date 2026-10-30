/**
 * Representa la estructura de respuesta enviada por la API
 * al cambiar la base de datos activa de la sesión.
 * `data.name` es la base de datos que el servidor dejó como activa.
 */
export interface SwitchDatabaseApiResponse {
  correlationId: string
  data: {
    name: string
    compatibility: number
    description: string | null
    server: string
    prodDatabase: string
    viewdefinitionPermission: boolean
  }
}
