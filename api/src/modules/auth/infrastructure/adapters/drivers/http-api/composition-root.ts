import { HttpAuthenticatorService } from '@auth/application/http-authenticator.service'
import {
  CheckSessionUseCase,
  ListDatabasesUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  SwitchDatabaseUseCase,
  VerifyAccessTokenUseCase,
} from '@auth/application/use-cases'
import {
  JwtTokenManagerAdapter,
  MssqlStoreRepositoryAdapter,
  MssqlUserRepositoryAdapter,
  TokenBlacklistCacheAdapter,
} from '@auth/infrastructure/adapters/drivens'
import { ValkeyCacheRepository } from '@core/cache/valkey-cache-repository'
import { loggerContext } from '@observability/infrastructure/context/logger-context.adapter'
import { logger } from '@observability/infrastructure/logging/logger-instance'

import { CheckSessionController } from './check-session/check-session.controller'
import { ListDatabasesController } from './list-databases/list-databases.controller'
import { LoginController } from './login/login.controller'
import { LogoutController } from './logout/logout.controller'
import { RefreshTokenController } from './refresh-token/refresh-token.controller'
import { SwitchDatabaseController } from './switch-database/switch-database.controller'

/*************************************
 * Inyección de dependencias API-REST
 *************************************/
const compositionMock = () => {
  // DRIVENS
  const storeRepositoty = new MssqlStoreRepositoryAdapter() // repositorio
  const userRepository = new MssqlUserRepositoryAdapter() // repositorio
  const cacheRepository = new ValkeyCacheRepository()
  const jwtTokenManager = new JwtTokenManagerAdapter()
  const blacklist = new TokenBlacklistCacheAdapter(cacheRepository)

  // USE CASES
  const loginUseCase = new LoginUseCase(userRepository, storeRepositoty, cacheRepository, jwtTokenManager, logger)
  const logoutUseCase = new LogoutUseCase(cacheRepository, jwtTokenManager, logger, loggerContext)
  const refreshTokenUseCase = new RefreshTokenUseCase(jwtTokenManager, cacheRepository, blacklist, logger, loggerContext)
  const checkSessionUseCase = new CheckSessionUseCase(storeRepositoty, logger)
  const verifyAccessTokenUseCase = new VerifyAccessTokenUseCase(jwtTokenManager, cacheRepository, blacklist, logger, loggerContext)
  const listDatabaseUseCase = new ListDatabasesUseCase(storeRepositoty, logger)
  const switchDatabaseUseCase = new SwitchDatabaseUseCase(cacheRepository, storeRepositoty, logger)

  // SERVICE ORCHESTRATOR
  const controlAuthenticatorService = new HttpAuthenticatorService(
    loginUseCase,
    logoutUseCase,
    refreshTokenUseCase,
    checkSessionUseCase,
    listDatabaseUseCase,
    switchDatabaseUseCase,
    verifyAccessTokenUseCase,
  )

  // CONTROLLERS
  const loginController = new LoginController(controlAuthenticatorService, jwtTokenManager)
  const logoutController = new LogoutController(controlAuthenticatorService)
  const refreshTokenController = new RefreshTokenController(controlAuthenticatorService)
  const checkSessionController = new CheckSessionController(controlAuthenticatorService)
  const listDatabasesController = new ListDatabasesController(controlAuthenticatorService)
  const switchDatabaseController = new SwitchDatabaseController(controlAuthenticatorService)

  return {
    loginController,
    logoutController,
    refreshTokenController,
    checkSessionController,
    listDatabasesController,
    switchDatabaseController,
  }
}
export const {
  checkSessionController,
  loginController,
  logoutController,
  refreshTokenController,
  listDatabasesController,
  switchDatabaseController,
} = compositionMock()
