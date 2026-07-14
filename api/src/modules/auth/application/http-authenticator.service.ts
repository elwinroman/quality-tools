import { AccessTokenDecoded, NewTokens } from '@auth/domain/ports/drivens/for-token-management.port'
import { ForHttpAuthenticatingPort } from '@auth/domain/ports/drivers/for-http-authenticating.port'
import { AuthenticatedUser } from '@auth/domain/schemas/auth-user'
import { PermissionStore, StoreInfo } from '@auth/domain/schemas/store'
import { StoreUserSchema } from '@shared/domain/store'

import {
  CheckSessionUseCase,
  ListDatabasesUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  SwitchDatabaseUseCase,
  VerifyAccessTokenUseCase,
} from './use-cases'

export class HttpAuthenticatorService implements ForHttpAuthenticatingPort {
  constructor(
    private readonly loginUC: LoginUseCase,
    private readonly logoutUC: LogoutUseCase,
    private readonly refreshTokenUC: RefreshTokenUseCase,
    private readonly checkSessionUC: CheckSessionUseCase,
    private readonly listDatabasesUC: ListDatabasesUseCase,
    private readonly switchDatabaseUC: SwitchDatabaseUseCase,
    private readonly verifyAccessTokenUC: VerifyAccessTokenUseCase,
  ) {}

  async login(sqlUser: StoreUserSchema): Promise<AuthenticatedUser> {
    return this.loginUC.execute(sqlUser)
  }

  async logout(tokens: NewTokens): Promise<{ message: string }> {
    return this.logoutUC.execute(tokens)
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return this.refreshTokenUC.execute(refreshToken)
  }

  async checkSession(
    credentials: StoreUserSchema,
  ): Promise<{ databaseConnection: string; viewdefinitionPermission: boolean; checkedAt: Date | string }> {
    return this.checkSessionUC.execute(credentials)
  }

  health(): void {
    // code here
  }

  async listDatabases(credentials: Omit<StoreUserSchema, 'database'>): Promise<string[]> {
    return this.listDatabasesUC.execute(credentials)
  }

  async switchDatabase(
    userId: number,
    sessionId: string,
    newDatabase: string,
    currentCredentials: StoreUserSchema,
  ): Promise<StoreInfo & PermissionStore> {
    return this.switchDatabaseUC.execute(userId, sessionId, newDatabase, currentCredentials)
  }

  async verifyAccessToken(token: string): Promise<AccessTokenDecoded> {
    return this.verifyAccessTokenUC.execute(token)
  }
}
