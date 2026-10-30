import { CheckSessionApiResponse } from '@/models/api'

export interface CheckSessionResponse {
  statusDatabaseConn: string
  statusViewDefinition: boolean
  /** Base de datos activa informada por el servidor. */
  database: string
}

export const checkSessionAdapter = (apiResponse: CheckSessionApiResponse): CheckSessionResponse => {
  return {
    statusDatabaseConn: apiResponse.data.databaseConnection,
    statusViewDefinition: apiResponse.data.viewdefinitionPermission,
    database: apiResponse.data.database,
  }
}
