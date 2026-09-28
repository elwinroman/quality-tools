export interface RevocableToken {
  jti: string
  type: string
  userId: number
}

/**
 * Owns token-revocation semantics independently of the persistence technology.
 *
 * Revocations remain effective for the supplied remaining token lifetime. The
 * store must preserve token identity metadata for operational compatibility,
 * treat any persisted marker as revoked, and propagate persistence failures.
 */
export interface TokenRevocationStore {
  isRevoked(jti: string): Promise<boolean>
  revoke(token: RevocableToken, expiresInSeconds: number): Promise<void>
}
