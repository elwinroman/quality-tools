import { AuthContext } from '@/models'
import { AuthenticatedUser } from '@/models/auth'

export const createSessionAdapter = (authenticatedUser: AuthenticatedUser): AuthContext => {
  return {
    database: authenticatedUser.databaseInfo.name,
    server: authenticatedUser.databaseInfo.server,
    username: authenticatedUser.username,
    prodDatabase: authenticatedUser.databaseInfo.prodDatabase,
    originalServer: authenticatedUser.originalServer,
  }
}
