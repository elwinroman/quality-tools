import { PersistedUser, PrimitiveUser } from '@auth/domain/schemas/user'

export interface ForUserRepositoryPort {
  getOrCreate(user: PrimitiveUser, userDatabase: string): Promise<PersistedUser | null>
  getById(id: number): Promise<PersistedUser | null>
}
