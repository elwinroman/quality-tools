import { UserType } from '@core/store/mssql-database-connection'
import { StoreUserSchema } from '@shared/domain/store'

/**
 * Provee la identidad de una petición autenticada y credenciales de store
 * utilizables. Las credenciales son copias en texto plano acotadas al llamador
 * y no deben mutarse hacia estado de sesión compartido ni retenerse más allá
 * de la operación.
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
 * Es responsable de resolver la identidad de la petición actual y su store
 * ligado a la sesión.
 *
 * La resolución requiere un contexto autenticado con un identificador de
 * sesión y credenciales de sesión vivas. Un contexto o credenciales faltantes
 * rechazan la operación; los fallos de almacenamiento y descifrado se propagan
 * al llamador.
 */
export interface CurrentStoreContextResolver {
  resolve(): Promise<StoreAuthContext>
}
