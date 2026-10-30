import { UserHashId } from '../value-objects/user-hash-id'

export const UserRoleList = {
  ADMIN: 'administrador',
  ANALIST: 'analista',
  AUDIT: 'auditor',
} as const

export type UserRole = (typeof UserRoleList)[keyof typeof UserRoleList]

export interface PrimitiveUser {
  id?: number
  hashId: UserHashId // Value Object en lugar de string
  user: string
  role: UserRole
  host: string
  aliasHost: string
  createdAt: string | Date
  isActive: boolean
}

export interface PersistedUser extends PrimitiveUser {
  id: number
}

export class User {
  constructor(private atributes: PrimitiveUser) {}

  static create(createUser: {
    id?: number
    hashId?: string
    user: string
    role?: UserRole
    host: string
    aliasHost: string
    createdAt?: string | Date
    isActive?: boolean
  }): User {
    return new User({
      id: createUser.id ?? undefined,
      hashId: UserHashId.create(createUser.user, createUser.host, createUser.hashId),
      user: createUser.user.toLowerCase(),
      role: createUser.role ?? UserRoleList.ANALIST,
      host: createUser.host,
      aliasHost: createUser.aliasHost,
      createdAt: createUser.createdAt ?? new Date().toISOString(),
      isActive: createUser.isActive ?? true,
    })
  }

  /**
   * Arma el usuario ya persistido. El id es obligatorio a propósito: si no lo tenés,
   * este camino no compila, en vez de afirmar un id que puede no existir.
   */
  static persisted(persistedUser: {
    id: number
    hashId: string
    user: string
    role?: UserRole
    host: string
    aliasHost: string
    createdAt?: string | Date
    isActive?: boolean
  }): PersistedUser {
    return { ...User.create(persistedUser).toValue(), id: persistedUser.id }
  }

  get idValue(): number | undefined {
    return this.atributes.id
  }

  toValue(): PrimitiveUser {
    return {
      id: this.atributes.id,
      hashId: this.atributes.hashId,
      user: this.atributes.user,
      role: this.atributes.role,
      host: this.atributes.host,
      aliasHost: this.atributes.aliasHost,
      createdAt: this.atributes.createdAt,
      isActive: this.atributes.isActive,
    }
  }
}
