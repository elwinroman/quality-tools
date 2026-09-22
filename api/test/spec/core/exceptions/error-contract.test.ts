import { NotProvidedTokenException } from '@auth/application/exceptions/not-provided-token.exception'
import { TokenExpiredException } from '@auth/application/exceptions/token-expired.exception'
import { UserAlreadyAuthenticatedException } from '@auth/application/exceptions/user-already-authenticated.exception'
import { InvalidCredentialsException } from '@auth/domain/exceptions/invalid-credentials.exception'
import { PermissionDenyException } from '@auth/domain/exceptions/permission-deny.exceptions'
import { BusquedaRecienteNotFoundException } from '@busqueda-reciente/domain/exceptions/busqueda-reciente-not-found.exception'
import { BaseError } from '@core/exceptions/base-error'
import { CacheConnectionErrorException } from '@core/exceptions/cache/cache-connection-error.exception'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import { DecryptionException } from '@core/exceptions/decryption.exception'
import { DatabaseConnectionErrorException } from '@core/exceptions/store/database-connection-error.exception'
import { DatabasePreparedStatementErrorException } from '@core/exceptions/store/database-prepared-statement-error.exception'
import { DatabaseRequestErrorException } from '@core/exceptions/store/database-request-error.exception'
import { DatabaseTransactionErrorException } from '@core/exceptions/store/database-transaction-error.exception'
import { SysobjectIdsInconsistencyException } from '@core/exceptions/store/sysobject-ids-inconsistency.exception'
import { InfrastructureError } from '@core/infrastructure-error.exception'
import { FavoritoAlreadyExistsException } from '@favorito/domain/exceptions/favorito-already-exists.exception'
import { FavoritoNotFoundException } from '@favorito/domain/exceptions/favorito-not-found.exception'
import { ApplicationError } from '@shared/application/application-error'
import { ForbiddenException } from '@shared/application/exceptions/forbidden.exception'
import { RouteNotFoundException } from '@shared/application/exceptions/route-not-found.exception'
import { SafeInternalServerErrorException } from '@shared/application/exceptions/safe-internal-error.exception'
import { UnauthorizedException } from '@shared/application/exceptions/unauthorized.exception'
import { ValidationException } from '@shared/application/exceptions/validation.exception'
import { DomainError } from '@shared/domain/domain-error'
import { InternalServerErrorException } from '@shared/domain/exceptions/internal-server-error.exception'
import { ProdSysObjectNotFoundException } from '@sysobject/domain/exceptions/prod-sysobject-not-found.exception'
import { SysObjectNotFoundException } from '@sysobject/domain/exceptions/sysobject-not-found.exception'
import { RegisterSearchLogErrorException } from '@sysobject/infrastructure/exceptions/register-search-log-error.exception'
import { describe, expect, it } from 'vitest'

/**
 * Base classes the global error middleware routes on.
 *
 * `domain` and `application` errors are exposed to the client with their own
 * `status`/`errorCode`/`detail`; `infrastructure` errors are masked behind a
 * SafeInternalServerErrorException. Extending the wrong base silently changes
 * whether `detail` reaches the client, so every case asserts both the expected
 * base and the absence of the other two.
 */
const BASE_CLASSES = {
  domain: DomainError,
  application: ApplicationError,
  infrastructure: InfrastructureError,
} as const

type ErrorLayer = keyof typeof BASE_CLASSES

const ERROR_LAYERS = Object.keys(BASE_CLASSES) as ErrorLayer[]

interface ErrorContractCase {
  /** Test label; also used as the describe.each section title. */
  name: string
  /** Layer whose base class decides the middleware routing. */
  layer: ErrorLayer
  /** Builds a fresh instance with deterministic constructor arguments. */
  create: () => BaseError
  status: number
  errorCode: number
  title: string
  type: string
  detail: string
  message: string
  logLevel?: 'error' | 'warn' | 'info' | 'debug'
}

const errorContractCases: ErrorContractCase[] = [
  // Infrastructure layer: masked by the middleware.
  {
    name: 'CacheConnectionErrorException',
    layer: 'infrastructure',
    create: () => new CacheConnectionErrorException('timeout'),
    status: 500,
    errorCode: 5100,
    title: 'Error de conexión a caché',
    type: 'CacheConnectionErrorException',
    detail: 'Ha ocurrido un error al intentar conectar con el sistema de caché: timeout',
    message: '[cache] Conexión fallida con ioValkey: timeout',
  },
  {
    name: 'CacheCredentialNotFoundException',
    layer: 'infrastructure',
    create: () => new CacheCredentialNotFoundException(42),
    status: 500,
    errorCode: 5101,
    title: 'Credenciales no encontradas en caché',
    type: 'CacheCredentialNotFoundException',
    detail:
      "No se encontraron las credenciales de base de datos para el usuario con ID '42' en la caché. Este es un error interno inesperado y puede deberse a una limpieza involuntaria o una falla en el mecanismo de almacenamiento en caché.",
    message: '[cache] Credenciales no encontradas para usuario: 42',
  },
  {
    name: 'DecryptionException con preview largo',
    layer: 'infrastructure',
    create: () => new DecryptionException('abcdefgh'),
    status: 500,
    errorCode: 5200,
    title: 'Error de desencriptación',
    type: 'DecryptionException',
    detail:
      'No se pudo completar la operación de desencriptación. Probablemente no se está encriptando correctamente las variables de entorno. Preview: "abc****gh"',
    message: "[crypto] Desencriptación fallida para 'abc****gh'",
  },
  {
    name: 'DecryptionException con preview corto',
    layer: 'infrastructure',
    create: () => new DecryptionException('abc'),
    status: 500,
    errorCode: 5200,
    title: 'Error de desencriptación',
    type: 'DecryptionException',
    detail:
      'No se pudo completar la operación de desencriptación. Probablemente no se está encriptando correctamente las variables de entorno. Preview: "[No disponible - Preview corto]"',
    message: "[crypto] Desencriptación fallida para '[No disponible - Preview corto]'",
  },
  {
    name: 'DatabaseConnectionErrorException',
    layer: 'infrastructure',
    create: () => new DatabaseConnectionErrorException('ECONNCLOSED', 'Connection is closed'),
    status: 500,
    errorCode: 5000,
    title: 'Error de conexión a base de datos',
    type: 'DatabaseConnectionErrorException',
    detail: 'Hubo un error relacionado con la conexión y el pool de conexiones. ECONNCLOSED - Connection is closed',
    message: '[db] Error de conexión: ECONNCLOSED - Connection is closed',
  },
  {
    name: 'DatabaseRequestErrorException',
    layer: 'infrastructure',
    create: () => new DatabaseRequestErrorException('EREQUEST', 'Invalid request'),
    status: 500,
    errorCode: 5002,
    title: 'Error en consulta de base de datos',
    type: 'DatabaseRequestErrorException',
    detail: 'Hubo un error relacionado con la ejecución de consultas y procedimientos almacenados. EREQUEST - Invalid request',
    message: '[db] Error en consulta: EREQUEST - Invalid request',
  },
  {
    name: 'DatabasePreparedStatementErrorException',
    layer: 'infrastructure',
    create: () => new DatabasePreparedStatementErrorException('EPREPARE', 'Invalid prepared statement'),
    status: 500,
    errorCode: 5003,
    title: 'Error en sentencia preparada',
    type: 'DatabasePreparedStatementErrorException',
    detail: 'Hubo un error relacionado con las sentencias preparadas. EPREPARE - Invalid prepared statement',
    message: '[db] Error en sentencia preparada: EPREPARE - Invalid prepared statement',
  },
  {
    name: 'DatabaseTransactionErrorException',
    layer: 'infrastructure',
    create: () => new DatabaseTransactionErrorException('ETRAN', 'Invalid transaction'),
    status: 500,
    errorCode: 5004,
    title: 'Error en transacción de base de datos',
    type: 'DatabaseTransactionErrorException',
    detail: 'Hubo un error relacionado con la creación, confirmación y anulación de transacciones. ETRAN - Invalid transaction',
    message: '[db] Error en transacción: ETRAN - Invalid transaction',
  },
  {
    name: 'SysobjectIdsInconsistencyException',
    layer: 'infrastructure',
    create: () => new SysobjectIdsInconsistencyException(2, 1),
    status: 500,
    errorCode: 5300,
    title: 'Inconsistencia en los IDs de objetos',
    type: 'SysobjectIdsInconsistencyException',
    detail: 'El repositorio de objetos devolvió una cantidad de IDs distinta a la esperada. Se esperaban 2 IDs y se recibieron 1.',
    message: '[store] Inconsistencia en la recuperación de IDs: se esperaban 2 IDs y se recibieron 1',
  },
  {
    name: 'RegisterSearchLogErrorException',
    layer: 'infrastructure',
    create: () => new RegisterSearchLogErrorException('vwOrders', 'dbo'),
    status: 500,
    errorCode: 5001,
    title: 'Error de registro de log',
    type: 'RegisterSearchLogErrorException',
    detail: "No se ha podido registrar el log de búsqueda para 'dbo.vwOrders'.",
    message: '[sysobject] Error al registrar log de búsqueda: dbo.vwOrders',
  },

  // Domain layer: exposed with its own metadata.
  {
    name: 'InternalServerErrorException',
    layer: 'domain',
    create: () => new InternalServerErrorException(),
    status: 500,
    errorCode: 1002,
    title: 'Error interno del sistema',
    type: 'InternalServerErrorException',
    detail: 'Ha ocurrido un error inesperado. Intente nuevamente más tarde o contacte con soporte si el problema persiste.',
    message: '[internal] Error interno del sistema',
  },
  {
    name: 'SysObjectNotFoundException',
    layer: 'domain',
    create: () => new SysObjectNotFoundException(123),
    status: 404,
    errorCode: 3000,
    title: 'Objeto no encontrado',
    type: 'SysObjectNotFoundException',
    detail: 'No se ha encontrado el objeto sql: 123.',
    message: '[sysobject] Objeto SQL no encontrado: 123',
  },
  {
    name: 'ProdSysObjectNotFoundException',
    layer: 'domain',
    create: () => new ProdSysObjectNotFoundException('vwOrders', 'dbo'),
    status: 404,
    errorCode: 3001,
    title: 'Objeto no encontrado',
    type: 'ProdSysObjectNotFoundException',
    detail: 'No se ha encontrado el objeto `[dbo].[vwOrders]` en producción.',
    message: '[sysobject] Objeto no encontrado en preprod: [dbo].[vwOrders]',
  },
  {
    name: 'FavoritoNotFoundException',
    layer: 'domain',
    create: () => new FavoritoNotFoundException(7),
    status: 404,
    errorCode: 4001,
    title: 'Favorito no encontrado',
    type: 'FavoritoNotFoundException',
    detail: "El favorito con id '7' no fue encontrado.",
    message: '[favorito] Favorito no encontrado: 7',
  },
  {
    name: 'FavoritoAlreadyExistsException',
    layer: 'domain',
    create: () => new FavoritoAlreadyExistsException({ idUser: 9, schema: 'dbo', objectName: 'vwOrders' }),
    status: 409,
    errorCode: 4002,
    title: 'Favorito ya existe',
    type: 'FavoritoAlreadyExistsException',
    detail: "El favorito 'dbo.vwOrders' ya existe para el usuario '9'.",
    message: '[favorito] Favorito ya existe: dbo.vwOrders',
  },
  {
    name: 'BusquedaRecienteNotFoundException',
    layer: 'domain',
    create: () => new BusquedaRecienteNotFoundException('abc'),
    status: 404,
    errorCode: 4000,
    title: 'Búsqueda reciente no encontrada',
    type: 'BusquedaRecienteNotFoundException',
    detail: "La búsqueda reciente con id 'abc' no fue encontrada.",
    message: '[busqueda-reciente] Búsqueda reciente no encontrada: abc',
  },
  {
    name: 'PermissionDenyException',
    layer: 'domain',
    create: () => new PermissionDenyException(),
    status: 403,
    errorCode: 2005,
    title: 'Acceso denegado',
    type: 'PermissionDenyException',
    detail:
      'Tu cuenta está inactiva. No puedes acceder al sistema. Por favor, contacta al administrador para más información o para reactivar tu cuenta.',
    message: '[auth] Usuario sin permisos',
  },
  {
    name: 'InvalidCredentialsException',
    layer: 'domain',
    create: () => new InvalidCredentialsException('El usuario no existe.'),
    status: 401,
    errorCode: 2000,
    title: 'Autenticación fallida',
    type: 'InvalidCredentialsException',
    detail: 'No se pudo establecer conexión con el servidor. El usuario no existe.',
    message: '[auth] Credenciales inválidas',
  },

  // Application layer: exposed with its own metadata.
  {
    name: 'ValidationException',
    layer: 'application',
    create: () => new ValidationException(['body.database: Required']),
    status: 422,
    errorCode: 1000,
    title: 'Parámetros inválidos',
    type: 'ValidationException',
    detail: 'Algunos campos no cumplen con el formato esperado. Por favor, revise los campos y vuelva a intentarlo.',
    message: '[validation] Parámetros inválidos en el payload: body.database: Required',
  },
  {
    name: 'RouteNotFoundException',
    layer: 'application',
    create: () => new RouteNotFoundException('/api/foo'),
    status: 404,
    errorCode: 1001,
    title: 'Ruta no encontrada',
    type: 'RouteNotFoundException',
    detail:
      'La dirección solicitada no existe o no está disponible en este momento. Verifica que la URL sea correcta e inténtalo nuevamente.',
    message: '[route] Ruta no encontrada: /api/foo',
  },
  {
    name: 'UnauthorizedException',
    layer: 'application',
    create: () => new UnauthorizedException(),
    status: 401,
    errorCode: 1004,
    title: 'Acceso denegado',
    type: 'UnauthorizedException',
    detail: 'No tienes los permisos necesarios para acceder a este recurso. Por favor, inicia sesión para continuar.',
    message: '[auth] Acceso denegado por falta de autorización',
  },
  {
    name: 'SafeInternalServerErrorException',
    layer: 'application',
    create: () => new SafeInternalServerErrorException(),
    status: 500,
    errorCode: 1003,
    title: 'Error interno del sistema',
    type: 'SafeInternalServerErrorException',
    detail: 'No pudimos completar la operación. Por favor, contacta con el administrador.',
    message: '[internal] Error interno encapsulado',
  },
  {
    name: 'ForbiddenException',
    layer: 'application',
    create: () => new ForbiddenException(),
    status: 403,
    errorCode: 1005,
    title: 'Acceso prohibido',
    type: 'ForbiddenException',
    detail: 'Tu cuenta no tiene permisos suficientes para realizar esta acción o acceder a este recurso.',
    message: '[auth] Acceso prohibido por falta de permisos',
  },
  {
    name: 'NotProvidedTokenException',
    layer: 'application',
    create: () => new NotProvidedTokenException('access token'),
    status: 401,
    errorCode: 2004,
    title: 'Token de autenticación requerido',
    type: 'NotProvidedTokenException',
    detail: "Debes proporcionar el 'access token' para acceder a este recurso.",
    message: '[auth] Token no proporcionado: access token',
  },
  {
    name: 'TokenExpiredException',
    layer: 'application',
    create: () => new TokenExpiredException('refresh token'),
    status: 401,
    errorCode: 2003,
    title: 'Autenticación expirada',
    type: 'TokenExpiredException',
    detail: 'El refresh token ha expirado.',
    message: '[auth] Token expirado: refresh token',
    logLevel: 'debug',
  },
  {
    name: 'UserAlreadyAuthenticatedException',
    layer: 'application',
    create: () => new UserAlreadyAuthenticatedException(),
    status: 409,
    errorCode: 2001,
    title: 'Sesión ya iniciada',
    type: 'UserAlreadyAuthenticatedException',
    detail: 'Ya tienes una sesión activa. Cierra la sesión actual antes de iniciar una nueva.',
    message: '[auth] Usuario ya autenticado',
  },
]

describe('Contrato de errores de la API', () => {
  describe.each(errorContractCases)('$name', ({ layer, create, status, errorCode, title, type, detail, message, logLevel }) => {
    it('expone status, errorCode, título y tipo propios', () => {
      const error = create()

      expect(error.status).toBe(status)
      expect(error.errorCode).toBe(errorCode)
      expect(error.title).toBe(title)
      expect(error.type).toBe(type)
      expect(error.metadata).toEqual(logLevel === undefined ? { status, errorCode } : { status, errorCode, logLevel })
    })

    it('construye el detail público y el mensaje interno esperados', () => {
      const error = create()

      expect(error.detail).toBe(detail)
      expect(error.message).toBe(message)
    })

    it('hereda de la base que define si su detail se expone o se enmascara', () => {
      const error = create()

      expect(error instanceof BASE_CLASSES[layer]).toBe(true)
      for (const otherLayer of ERROR_LAYERS) {
        if (otherLayer === layer) continue
        expect(error instanceof BASE_CLASSES[otherLayer]).toBe(false)
      }
    })
  })
})
