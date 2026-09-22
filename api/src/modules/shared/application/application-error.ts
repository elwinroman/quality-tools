import { BaseError } from '@core/exceptions/base-error'

/**
 * Clase base abstracta para errores de la capa de APLICACIÓN.
 *
 * Usar para errores relacionados con orquestación y validación de casos de uso:
 * - Validación de inputs (DTOs, request params)
 * - Errores de autenticación/autorización
 * - Errores de flujo de aplicación
 * - Precondiciones no cumplidas
 *
 * @example
 * ```typescript
 * export class ValidationException extends ApplicationError {
 *   readonly type = 'ValidationException'
 *   static readonly title = 'Parámetros inválidos'
 *   readonly detail: string
 *   static readonly metadata = { status: 422, errorCode: 1000 }
 *
 *   constructor(errors: string[]) {
 *     super(`[validation] Parámetros inválidos en el payload: ${errors.join('; ')}`)
 *     this.detail = 'Algunos campos no cumplen con el formato esperado. Por favor, revise los campos y vuelva a intentarlo.'
 *   }
 * }
 * ```
 */
export abstract class ApplicationError extends BaseError {}
