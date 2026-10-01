/**
 * Representa la estructura de respuesta enviada por la API
 * al verificar el estado de la sesión actual.
 * Incluye información sobre la conexión a la base de datos,
 * permisos de visualización, la base de datos activa y la fecha de verificación.
 */
export interface CheckSessionApiResponse {
  correlationId: string
  data: {
    databaseConnection: string
    viewdefinitionPermission: boolean
    checkedAt: Date | string
    /** Base de datos activa de la sesión, resuelta por el servidor. */
    database: string
  }
}
