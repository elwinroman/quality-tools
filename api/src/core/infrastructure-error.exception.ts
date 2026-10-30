import { BaseError } from '@core/exceptions/base-error'

/**
 * Clase base abstracta para errores de la capa de INFRAESTRUCTURA.
 *
 * Usar para errores relacionados con servicios externos y recursos técnicos:
 * - Errores de conexión a base de datos
 * - Errores de cache (Redis, Valkey)
 * - Errores de servicios externos (APIs, SMTP)
 * - Errores de filesystem
 * - Errores de encriptación/desencriptación
 *
 * IMPORTANTE: Los errores de infraestructura se enmascaran automáticamente
 * en el middleware para no exponer detalles técnicos al cliente.
 *
 * @example
 * ```typescript
 * export class DatabaseConnectionErrorException extends InfrastructureError {
 *   readonly type = 'DatabaseConnectionErrorException'
 *   static readonly title = 'Error de conexión a base de datos'
 *   readonly detail: string
 *   static readonly metadata = { status: 500, errorCode: 5000 }
 *
 *   constructor(code: string, message: string, cause?: Error) {
 *     super(`[db] Error de conexión: ${code} - ${message}`, cause)
 *     this.detail = `Hubo un error relacionado con la conexión y el pool de conexiones. ${code} - ${message}`
 *   }
 * }
 * ```
 */
export abstract class InfrastructureError extends BaseError {}
