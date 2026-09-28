import { CurrentStoreContextResolver, StoreAuthContext } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { SessionCredentialStore } from '@auth/domain/ports/drivens/session-credential-store.port'
import { getAuthContext } from '@auth/infrastructure/auth-context'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'

export class CurrentStoreContextResolverAdapter implements CurrentStoreContextResolver {
  constructor(private readonly sessionCredentialStore: SessionCredentialStore) {}

  async resolve(): Promise<StoreAuthContext> {
    const authContext = getAuthContext()
    if (!authContext) throw new Error('No se pudo recuperar el contexto de autenticación')
    if (!authContext.sessionId) throw new CacheCredentialNotFoundException(authContext.userId)

    const cached = await this.sessionCredentialStore.find(authContext.userId, authContext.sessionId)
    if (!cached) throw new CacheCredentialNotFoundException(authContext.userId)

    return {
      authContext: {
        ...authContext,
        sessionId: authContext.sessionId,
      },
      store: {
        credentials: { ...cached.credentials },
        type: cached.type,
      },
    }
  }
}
