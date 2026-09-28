import { UserType } from '@core/store/mssql-database-connection'
import { StoreUserSchema } from '@shared/domain/store'

export interface SessionCredentials {
  credentials: StoreUserSchema
  type: UserType
}

/**
 * Defers a selected-database replacement after capturing a live session's
 * remaining lifetime. The prepared update is single-session state: callers
 * validate the database before committing, and commit failures propagate.
 */
export interface PreparedSelectedDatabaseUpdate {
  commit(credentials: StoreUserSchema): Promise<void>
}

/**
 * Owns persistence and retrieval of credentials bound to an authenticated
 * session, applying the composition-selected credential transformation policy
 * at the storage boundary. That policy may be pass-through or cryptographic.
 *
 * Saved credentials live for the configured session lifetime. Reads return
 * plaintext copies or `null` when no session exists. Preparing an update must
 * reject expired or missing sessions and preserve the captured remaining
 * lifetime when the replacement is committed. Storage and configured
 * transformation failures propagate without fallback.
 */
export interface SessionCredentialStore {
  save(userId: number, sessionId: string, credentials: StoreUserSchema): Promise<void>
  find(userId: number, sessionId: string): Promise<SessionCredentials | null>
  prepareSelectedDatabaseUpdate(userId: number, sessionId: string): Promise<PreparedSelectedDatabaseUpdate>
}
