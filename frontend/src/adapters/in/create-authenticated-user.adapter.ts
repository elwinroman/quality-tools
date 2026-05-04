import { AuthenticatedUserApiResponse } from '@/models/api'
import { AuthenticatedUser } from '@/models/auth'

export const createAuthenticatedUserAdapter = (apiResponse: AuthenticatedUserApiResponse): AuthenticatedUser => {
  return {
    idUser: apiResponse.data.id,
    username: apiResponse.data.user,
    token: apiResponse.data.accessToken,
    originalServer: apiResponse.data.aliasHost,
    databaseInfo: {
      compatibility: apiResponse.data.storeDetails.compatibility,
      description: apiResponse.data.storeDetails.description,
      name: apiResponse.data.storeDetails.name,
      prodDatabase: apiResponse.data.storeDetails.prodDatabase,
      server: apiResponse.data.storeDetails.server,
    },
  }
}
