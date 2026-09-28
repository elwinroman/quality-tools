import { UserType } from '@core/store/mssql-database-connection'
import { StoreUserSchema } from '@shared/domain/store'

/**
 * Provides one authenticated request's identity and usable store credentials.
 * Credentials are plaintext copies scoped to the caller and must not be
 * mutated into shared session state or retained beyond the operation.
 */
export interface StoreAuthContext {
  authContext: {
    userId: number
    sessionId: string
    email?: string
    roles?: string[]
  }
  store: {
    credentials: StoreUserSchema
    type: UserType
  }
}

/**
 * Owns resolution of the current request identity and its session-bound store.
 *
 * Resolution requires an authenticated context with a session identifier and
 * live session credentials. Missing context or credentials reject the
 * operation; storage and decryption failures propagate to the caller.
 */
export interface CurrentStoreContextResolver {
  resolve(): Promise<StoreAuthContext>
}
