import { ProxyAuthenticatorService } from '@auth/application/proxy-authenticator.service'
import { VerifyAccessTokenUseCase } from '@auth/application/use-cases'
import {
  CacheSessionCredentialStoreAdapter,
  CacheTokenRevocationStoreAdapter,
  JwtTokenManagerAdapter,
} from '@auth/infrastructure/adapters/drivens'
import { ValkeyCacheRepository } from '@core/cache/valkey-cache-repository'
import { createCredentialDecryptor } from '@core/crypto/create-credential-decryptor.factory'
import { createCredentialEncryptor } from '@core/crypto/create-credential-encryptor.factory'
import { loggerContext } from '@observability/infrastructure/context/logger-context.adapter'
import { logger } from '@observability/infrastructure/logging/logger-instance'

import { JWT_REFRESH_TOKEN_TTL } from '@/config/enviroment'

import { AuthenticatorProxyAdapter } from './authenticator-proxy-adapter'

/**********************************
 * Inyección de dependencias PROXY
 **********************************/
const compositionMock = () => {
  // DRIVENS
  const tokenManager = new JwtTokenManagerAdapter()
  const cacheRepository = new ValkeyCacheRepository()
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

  // USE CASES
  const verifyAccessTokenUC = new VerifyAccessTokenUseCase(
    tokenManager,
    tokenRevocationStore,
    logger,
    loggerContext,
    sessionCredentialStore,
  )

  // SERVICE ORCHESTRATOR
  const authenticatorService = new ProxyAuthenticatorService(verifyAccessTokenUC)

  // PROXY ADAPTER
  const authenticatorProxyAdapter = new AuthenticatorProxyAdapter(authenticatorService)

  return {
    authenticatorProxyAdapter,
  }
}

export const { authenticatorProxyAdapter } = compositionMock()
