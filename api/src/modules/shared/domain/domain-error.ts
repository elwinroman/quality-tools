import { BaseError } from '@core/exceptions/base-error'

/**
 * Clase base abstracta para errores de la capa de DOMINIO.
 *
 * Usar para errores relacionados con reglas de negocio:
 * - Validaciones de entidades/value objects
 * - Invariantes del dominio violadas
 * - Recursos no encontrados
 * - Conflictos de estado
 *
 * @example
 * ```typescript
 * export class InvalidCredentialsException extends DomainError {
 *   readonly type = 'InvalidCredentialsException'
 *   static readonly title = 'Autenticación fallida'
 *   readonly detail: string
 *   static readonly metadata = { status: 401, errorCode: 2000 }
 *
 *   constructor(msgReason: string) {
 *     super('[auth] Credenciales inválidas')
 *     this.detail = `No se pudo establecer conexión con el servidor. ${msgReason}`
 *   }
 * }
 * ```
 */
export abstract class DomainError extends BaseError {}
