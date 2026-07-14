import { AuthenticatedUser } from '@auth/domain/schemas/auth-user'
import { PermissionStore, StoreInfo } from '@auth/domain/schemas/store'
import { StoreUserSchema } from '@shared/domain/store'

import { AccessTokenDecoded } from '../drivens/for-token-management.port'
import { NewTokens } from '../drivens/for-token-management.port'

export interface ForHttpAuthenticatingPort {
  login(sqlUser: StoreUserSchema): Promise<AuthenticatedUser>
  logout(tokens: NewTokens): Promise<{ message: string }>
  refreshToken(refreshToken: string): Promise<{ accessToken: string }>
  checkSession(
    credentials: StoreUserSchema,
  ): Promise<{ databaseConnection: string; viewdefinitionPermission: boolean; checkedAt: Date | string }>
  health(): void
  listDatabases(credentials: Omit<StoreUserSchema, 'database'>): Promise<string[]>
  switchDatabase(
    userId: number,
    sessionId: string,
    newDatabase: string,
    currentCredentials: StoreUserSchema,
  ): Promise<StoreInfo & PermissionStore>
  verifyAccessToken(token: string): Promise<AccessTokenDecoded>
}
