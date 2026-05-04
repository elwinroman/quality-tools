/**
 * Metadata HTTP del error
 * @property status - Código de estado HTTP (400, 401, 404, 500, etc.)
 * @property errorCode - Código único de error para identificación en el cliente
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface ErrorMetadata {
  status: number
  errorCode: number
  logLevel?: LogLevel
}

/**
 * Tipo para clases que extienden BaseError con propiedades estáticas
 */
export interface BaseErrorClass {
  readonly metadata: ErrorMetadata
  readonly title: string
  new (...args: unknown[]): BaseError
}

/**
 * Clase base abstracta para todos los errores de la aplicación.
 *
 * Cada excepción que extienda de esta clase es AUTO-CONTENIDA,
 * es decir, contiene su propio status HTTP y código de error.
 * No requiere mapeo manual externo.
 *
 * IMPORTANTE: `metadata` debe ser una propiedad ESTÁTICA en las clases hijas.
 * Esto permite acceder a los valores sin instanciar (útil para Swagger/docs).
 *
 * @example
 * ```typescript
 * export class MyException extends DomainError {
 *   static readonly metadata = { status: 400, errorCode: 1000 }
 *   static readonly title = 'Mi error'
 *
 *   readonly type = 'MyException'
 *   readonly detail = 'Descripción del error'
 *
 *   constructor() {
 *     super('[context] Mensaje interno para logs')
 *   }
 * }
 *
 * // Acceso sin instanciar (para docs/swagger):
 * MyException.metadata.status // 400
 * MyException.title // 'Mi error'
 *
 * // Acceso desde instancia:
 * const err = new MyException()
 * err.status // 400 (via getter)
 * err.title // 'Mi error' (via getter)
 * ```
 */
export abstract class BaseError extends Error {
  /**
   * Metadata estático - debe ser definido en cada clase hija.
   * TypeScript no soporta `abstract static`, por eso no está declarado aquí.
   * Los getters `status` y `errorCode` leen de esta propiedad estática.
   */
  static readonly metadata: ErrorMetadata

  /**
   * Título estático - debe ser definido en cada clase hija.
   * El getter `title` lee de esta propiedad estática.
   */
  static readonly title: string

  /**
   * Identificador técnico del error.
   * Se usa en logs, Sentry, y respuesta API.
   * Convencionalmente es el nombre de la clase.
   */
  abstract readonly type: string

  /**
   * Descripción detallada del problema, orientada al usuario/UI.
   * Puede incluir contexto específico de la operación.
   */
  abstract readonly detail: string

  /**
   * Error original que causó este error (para encadenamiento).
   * Útil para debugging y trazabilidad.
   */
  readonly cause?: Error

  constructor(message: string, cause?: Error) {
    super(message)
    this.name = this.constructor.name
    this.cause = cause

    // Mantiene el stack trace correcto en V8 (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /** HTTP status code (lee de la propiedad estática de la clase) */
  get status(): number {
    return (this.constructor as typeof BaseError).metadata.status
  }

  /** Código de error único (lee de la propiedad estática de la clase) */
  get errorCode(): number {
    return (this.constructor as typeof BaseError).metadata.errorCode
  }

  /** Acceso a metadata completo desde instancia */
  get metadata(): ErrorMetadata {
    return (this.constructor as typeof BaseError).metadata
  }

  /** Título del error (lee de la propiedad estática de la clase) */
  get title(): string {
    return (this.constructor as typeof BaseError).title
  }
}
