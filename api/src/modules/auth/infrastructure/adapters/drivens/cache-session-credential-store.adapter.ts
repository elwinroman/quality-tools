import {
  PreparedSelectedDatabaseUpdate,
  SelectedDatabaseUpdateResult,
  SessionCredentials,
  SessionCredentialStore,
} from '@auth/domain/ports/drivens/session-credential-store.port'
import { KeyValueStore } from '@core/cache/key-value-store'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import { UserTypeEnum } from '@core/store/mssql-database-connection'
import { CredentialDecryptor } from '@shared/domain/credential-decryptor'
import { CredentialEncryptor } from '@shared/domain/credential-encryptor'
import { StoreUserSchema } from '@shared/domain/store'

export class CacheSessionCredentialStoreAdapter implements SessionCredentialStore {
  constructor(
    private readonly cacheRepository: KeyValueStore,
    private readonly credentialEncryptor: CredentialEncryptor,
    private readonly credentialDecryptor: CredentialDecryptor,
    private readonly sessionLifetimeSeconds: number,
  ) {}

  async save(userId: number, sessionId: string, credentials: StoreUserSchema): Promise<void> {
    await this.cacheRepository.set(this.buildKey(userId, sessionId), this.serialize(credentials), this.sessionLifetimeSeconds)
  }

  async find(userId: number, sessionId: string): Promise<SessionCredentials | null> {
    const cachedCredentials = await this.cacheRepository.get(this.buildKey(userId, sessionId))
    if (!cachedCredentials) return null

    const credentials: StoreUserSchema = JSON.parse(cachedCredentials)
    credentials.user = this.credentialDecryptor.decrypt(credentials.user)
    credentials.password = this.credentialDecryptor.decrypt(credentials.password)

    return { credentials, type: UserTypeEnum.External }
  }

  async prepareSelectedDatabaseUpdate(userId: number, sessionId: string): Promise<PreparedSelectedDatabaseUpdate> {
    const key = this.buildKey(userId, sessionId)
    const remainingTtl = await this.cacheRepository.ttl(key)
    if (remainingTtl <= 0) throw new CacheCredentialNotFoundException(userId)

    // Pre-imagen cruda del blob para el reemplazo condicional: debe compararse
    // literalmente contra lo almacenado, no contra una re-serializacion.
    const expected = await this.cacheRepository.get(key)

    return {
      commit: async (credentials): Promise<SelectedDatabaseUpdateResult> => {
        if (expected === null) return { committed: false }

        const committed = await this.cacheRepository.compareAndSet(key, expected, this.serialize(credentials), remainingTtl)

        return { committed }
      },
    }
  }

  private buildKey(userId: number, sessionId: string): string {
    return `auth:credentials:${userId}:${sessionId}`
  }

  private serialize(credentials: StoreUserSchema): string {
    return JSON.stringify({
      host: credentials.host,
      database: credentials.database,
      user: this.credentialEncryptor.encrypt(credentials.user),
      password: this.credentialEncryptor.encrypt(credentials.password),
    })
  }
}
