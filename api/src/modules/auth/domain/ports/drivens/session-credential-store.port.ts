import { UserType } from '@core/store/mssql-database-connection'
import { StoreUserSchema } from '@shared/domain/store'

export interface SessionCredentials {
  credentials: StoreUserSchema
  type: UserType
}

/**
 * Resultado de un reemplazo preparado de la base de datos seleccionada.
 * `committed` es `false` cuando el blob de sesión cambió entre la preparación
 * y la confirmación, así que el llamador decide cómo traducir el conflicto; el
 * adaptador nunca lanza excepción por ello.
 */
export interface SelectedDatabaseUpdateResult {
  committed: boolean
}

/**
 * Difiera un reemplazo de la base de datos seleccionada después de verificar que
 * la sesión sigue viva. La actualización preparada es estado de una sola sesión:
 * los llamadores validan la base de datos antes de confirmar, y los fallos de
 * confirmación se propagan.
 */
export interface PreparedSelectedDatabaseUpdate {
  commit(credentials: StoreUserSchema): Promise<SelectedDatabaseUpdateResult>
}

/**
 * Es responsable de la persistencia y recuperación de credenciales ligadas a
 * una sesión autenticada, aplicando en el límite de almacenamiento la política
 * de transformación de credenciales seleccionada en la composición. Esa
 * política puede ser de paso directo o criptográfica.
 *
 * Las credenciales guardadas viven durante el tiempo de vida configurado de la
 * sesión. Las lecturas devuelven copias en texto plano o `null` cuando no
 * existe sesión. Preparar una actualización debe rechazar sesiones expiradas o
 * inexistentes, y el almacenamiento conserva la expiración propia de la sesión
 * cuando se confirma el reemplazo. Los fallos de almacenamiento y de la
 * transformación configurada se propagan sin respaldo alternativo.
 */
export interface SessionCredentialStore {
  save(userId: number, sessionId: string, credentials: StoreUserSchema): Promise<void>
  find(userId: number, sessionId: string): Promise<SessionCredentials | null>
  prepareSelectedDatabaseUpdate(userId: number, sessionId: string): Promise<PreparedSelectedDatabaseUpdate>
}
