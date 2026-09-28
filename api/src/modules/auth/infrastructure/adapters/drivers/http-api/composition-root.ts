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
  CacheSessionCredentialStoreAdapter,
  CacheTokenRevocationStoreAdapter,
  JwtTokenManagerAdapter,
  MssqlStoreRepositoryAdapter,
  MssqlUserRepositoryAdapter,
} from '@auth/infrastructure/adapters/drivens'
import { CurrentStoreContextResolverAdapter } from '@auth/infrastructure/adapters/drivens/current-store-context-resolver.adapter'
import { ValkeyCacheRepository } from '@core/cache/valkey-cache-repository'
import { createCredentialDecryptor } from '@core/crypto/create-credential-decryptor.factory'
import { createCredentialEncryptor } from '@core/crypto/create-credential-encryptor.factory'
import { loggerContext } from '@observability/infrastructure/context/logger-context.adapter'
import { logger } from '@observability/infrastructure/logging/logger-instance'

import { JWT_REFRESH_TOKEN_TTL } from '@/config/enviroment'

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
  const tokenRevocationStore = new CacheTokenRevocationStoreAdapter(cacheRepository)
  // la elección texto plano / encriptado se decide en composición, no en la lógica del use-case
  const credentialDecryptor = createCredentialDecryptor()
  const credentialEncryptor = createCredentialEncryptor()
  const sessionCredentialStore = new CacheSessionCredentialStoreAdapter(
    cacheRepository,
    credentialEncryptor,
    credentialDecryptor,
    JWT_REFRESH_TOKEN_TTL,
  )
  const currentStoreContextResolver = new CurrentStoreContextResolverAdapter(sessionCredentialStore)

  // USE CASES
  const loginUseCase = new LoginUseCase(userRepository, storeRepositoty, sessionCredentialStore, jwtTokenManager, logger)
  const logoutUseCase = new LogoutUseCase(tokenRevocationStore, jwtTokenManager, logger, loggerContext)
  const refreshTokenUseCase = new RefreshTokenUseCase(jwtTokenManager, tokenRevocationStore, logger, loggerContext, sessionCredentialStore)
  const checkSessionUseCase = new CheckSessionUseCase(storeRepositoty, logger)
  const verifyAccessTokenUseCase = new VerifyAccessTokenUseCase(
    jwtTokenManager,
    tokenRevocationStore,
    logger,
    loggerContext,
    sessionCredentialStore,
  )
  const listDatabaseUseCase = new ListDatabasesUseCase(storeRepositoty, logger)
  const switchDatabaseUseCase = new SwitchDatabaseUseCase(sessionCredentialStore, storeRepositoty, logger)

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
  const checkSessionController = new CheckSessionController(controlAuthenticatorService, currentStoreContextResolver)
  const listDatabasesController = new ListDatabasesController(controlAuthenticatorService, currentStoreContextResolver)
  const switchDatabaseController = new SwitchDatabaseController(controlAuthenticatorService, currentStoreContextResolver)

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
