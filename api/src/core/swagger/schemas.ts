import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
// Auth Exceptions
import { NotProvidedTokenException, TokenExpiredException, UserAlreadyAuthenticatedException } from '@auth/application/exceptions'
import { InvalidCredentialsException, PermissionDenyException } from '@auth/domain/exceptions'
// Busqueda Reciente Exceptions
import { BusquedaRecienteNotFoundException } from '@busqueda-reciente/domain/exceptions/busqueda-reciente-not-found.exception'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
// Favorito Exceptions
import { FavoritoAlreadyExistsException } from '@favorito/domain/exceptions/favorito-already-exists.exception'
import { FavoritoNotFoundException } from '@favorito/domain/exceptions/favorito-not-found.exception'
// Application Exceptions
import {
  ForbiddenException,
  RouteNotFoundException,
  SafeInternalServerErrorException,
  UnauthorizedException,
  ValidationException,
} from '@shared/application/exceptions'
// Domain Exceptions
import { InternalServerErrorException } from '@shared/domain/exceptions/internal-server-error.exception'
// Sysobject Exceptions
import { ProdSysObjectNotFoundException } from '@sysobject/domain/exceptions/prod-sysobject-not-found.exception'
import { SysObjectNotFoundException } from '@sysobject/domain/exceptions/sysobject-not-found.exception'
import { z } from 'zod'

extendZodWithOpenApi(z)

/** Schema de error estándar — refleja exactamente lo que devuelve handleErrorMiddleware */
export const ErrorResponseSchema = z
  .object({
    correlationId: z.string().uuid(),
    error: z.object({
      type: z.string().openapi({ example: 'ValidationException' }),
      title: z.string().openapi({ example: 'Error de validación' }),
      status: z.number().openapi({ example: 422 }),
      detail: z.string().openapi({ example: 'Los parámetros proporcionados no son válidos' }),
      errorCode: z.number().openapi({ example: 1000 }),
      invalidParams: z.array(z.any()).optional().openapi({ description: 'Solo presente en errores de validación Zod (422)' }),
    }),
  })
  .openapi('ErrorResponse')

/** Schema de respuesta exitosa estándar */
export const SuccessResponseSchema = z
  .object({
    correlationId: z.string().uuid(),
    data: z.any(),
  })
  .openapi('SuccessResponse')

/** Schema de respuesta exitosa con metadata (para listas paginadas) */
export const SuccessListResponseSchema = z
  .object({
    correlationId: z.string().uuid(),
    meta: z.any(),
    data: z.array(z.any()),
  })
  .openapi('SuccessListResponse')

/** Schema de respuesta exitosa con mensaje (para operaciones de escritura) */
export const SuccessMessageResponseSchema = z
  .object({
    correlationId: z.string().uuid(),
    message: z.string(),
    data: z.any(),
  })
  .openapi('SuccessMessageResponse')

/** Schema de respuesta de eliminación */
export const DeleteResponseSchema = z
  .object({
    correlationId: z.string().uuid(),
    data: z.object({ msg: z.string() }),
  })
  .openapi('DeleteResponse')

type ErrorResponseConfig = Record<number, { description: string; content: { 'application/json': { schema: typeof ErrorResponseSchema } } }>

/**
 * Tipo base para excepciones con metadata estática.
 * Todas las excepciones del sistema deben tener esta estructura.
 */
interface ExceptionClass {
  readonly metadata: { status: number; errorCode: number }
  readonly title: string
}

/**
 * Registro de excepciones del sistema.
 * Las excepciones se importan directamente y su metadata se lee estáticamente.
 * NO hay duplicación: los valores vienen de las clases originales.
 */
const exceptionRegistry = {
  // Global (1xxx)
  ValidationException: {
    class: ValidationException,
    detail: 'Algunos campos no cumplen con el formato esperado.',
  },
  RouteNotFoundException: {
    class: RouteNotFoundException,
    detail: 'La dirección solicitada no existe o no está disponible.',
  },
  InternalServerErrorException: {
    class: InternalServerErrorException,
    detail: 'Ha ocurrido un error inesperado.',
  },
  SafeInternalServerErrorException: {
    class: SafeInternalServerErrorException,
    detail: 'No pudimos completar la operación.',
  },
  UnauthorizedException: {
    class: UnauthorizedException,
    detail: 'No tienes los permisos necesarios para acceder a este recurso.',
  },
  ForbiddenException: {
    class: ForbiddenException,
    detail: 'Tu cuenta no tiene permisos suficientes para esta acción.',
  },

  // Auth (2xxx)
  InvalidCredentialsException: {
    class: InvalidCredentialsException,
    detail: 'No se pudo conectar con el servidor. Verifique sus credenciales.',
  },
  UserAlreadyAuthenticatedException: {
    class: UserAlreadyAuthenticatedException,
    detail: 'Ya tienes una sesión activa.',
  },
  TokenExpiredException: {
    class: TokenExpiredException,
    detail: 'El token ha expirado.',
  },
  NotProvidedTokenException: {
    class: NotProvidedTokenException,
    detail: 'Debes proporcionar el token para acceder a este recurso.',
  },
  PermissionDenyException: {
    class: PermissionDenyException,
    detail: 'Tu cuenta está inactiva o no tienes permisos.',
  },
  CacheCredentialNotFoundException: {
    class: CacheCredentialNotFoundException,
    detail: 'No se encontraron las credenciales de base de datos en caché para la sesión.',
  },

  // Sysobject (3xxx)
  SysObjectNotFoundException: {
    class: SysObjectNotFoundException,
    detail: 'No se ha encontrado el objeto SQL solicitado.',
  },
  ProdSysObjectNotFoundException: {
    class: ProdSysObjectNotFoundException,
    detail: 'No se ha encontrado el objeto en producción.',
  },

  // Busqueda Reciente / Favorito (4xxx)
  BusquedaRecienteNotFoundException: {
    class: BusquedaRecienteNotFoundException,
    detail: 'La búsqueda reciente solicitada no fue encontrada.',
  },
  FavoritoNotFoundException: {
    class: FavoritoNotFoundException,
    detail: 'El favorito solicitado no fue encontrado.',
  },
  FavoritoAlreadyExistsException: {
    class: FavoritoAlreadyExistsException,
    detail: 'El favorito ya existe para este usuario.',
  },
} as const

type ExceptionName = keyof typeof exceptionRegistry

/**
 * Obtiene la metadata de una excepción desde su clase.
 */
function getExceptionInfo(name: ExceptionName): { status: number; errorCode: number; title: string; detail: string } {
  const entry = exceptionRegistry[name]
  const ExceptionClass = entry.class as unknown as ExceptionClass

  return {
    status: ExceptionClass.metadata.status,
    errorCode: ExceptionClass.metadata.errorCode,
    title: ExceptionClass.title,
    detail: entry.detail,
  }
}

/**
 * Genera respuestas de error para OpenAPI a partir de los nombres de excepciones.
 * Agrupa automáticamente por status code y genera descripciones legibles.
 *
 * @example
 * errorResponses('InvalidCredentialsException', 'ValidationException')
 * // → { 401: { description: '**Autenticación fallida** — ...' }, 422: { description: '...' } }
 */
export function errorResponses(...exceptionNames: ExceptionName[]): ErrorResponseConfig {
  const statusGroups: Record<number, string[]> = {}

  for (const name of exceptionNames) {
    const info = getExceptionInfo(name)

    const label = `**${info.title}** — ${info.detail} \`errorCode: ${info.errorCode}\``

    if (!statusGroups[info.status]) {
      statusGroups[info.status] = []
    }
    statusGroups[info.status].push(label)
  }

  const responses: ErrorResponseConfig = {}
  for (const [status, descriptions] of Object.entries(statusGroups)) {
    responses[Number(status)] = {
      description: descriptions.join(' | '),
      content: { 'application/json': { schema: ErrorResponseSchema } },
    }
  }

  return responses
}
