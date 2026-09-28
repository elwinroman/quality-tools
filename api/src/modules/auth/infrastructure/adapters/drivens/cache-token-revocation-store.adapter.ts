import { RevocableToken, TokenRevocationStore } from '@auth/domain/ports/drivens/token-revocation-store.port'
import { CacheRepository } from '@shared/domain/cache-repository'

export class CacheTokenRevocationStoreAdapter implements TokenRevocationStore {
  constructor(private readonly cacheRepository: CacheRepository) {}

  async isRevoked(jti: string): Promise<boolean> {
    const value = await this.cacheRepository.get(this.buildKey(jti))
    return value !== null
  }

  async revoke(token: RevocableToken, expiresInSeconds: number): Promise<void> {
    await this.cacheRepository.set(
      this.buildKey(token.jti),
      JSON.stringify({ type: token.type, jti: token.jti, user_id: token.userId }),
      expiresInSeconds,
    )
  }

  private buildKey(jti: string): string {
    return `blacklist:${jti}`
  }
}
