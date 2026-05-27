import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { registry } from '@core/swagger/openapi-registry'
import { errorResponses, SuccessListResponseSchema, SuccessResponseSchema } from '@core/swagger/schemas'
import { z } from 'zod'

import { ListDatabasesSchema } from './list-databases/list-databases.dto'
import { LoginUserSchema } from './login/login.http-dto'
import { SwitchDatabaseSchema } from './switch-database/switch-database.dto'

extendZodWithOpenApi(z)

// POST /api/v1/auth/login
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  tags: ['Auth'],
  summary: 'Autenticar usuario contra SQL Server',
  description:
    'Valida credenciales contra la instancia SQL Server indicada. Retorna un access token (JWT) y setea una cookie httpOnly con el refresh token.',
  request: {
    body: { content: { 'application/json': { schema: LoginUserSchema } } },
  },
  responses: {
    200: {
      description: 'Login exitoso. Retorna los datos de sesión con `accessToken` y setea cookie `refresh_token` (httpOnly).',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    ...errorResponses('InvalidCredentialsException', 'UserAlreadyAuthenticatedException', 'ValidationException'),
  },
})

// POST /api/v1/auth/logout
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  tags: ['Auth'],
  summary: 'Cerrar sesión',
  description: 'Invalida el access token enviado por Bearer y el refresh token recibido desde la cookie httpOnly.',
  security: [{ BearerAuth: [] }],
  request: {},
  responses: {
    200: {
      description: 'Logout exitoso. Cookie `refresh_token` eliminada.',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    ...errorResponses('NotProvidedTokenException', 'TokenExpiredException', 'UnauthorizedException'),
  },
})

// POST /api/v1/auth/refresh-token
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh-token',
  tags: ['Auth'],
  summary: 'Renovar access token',
  description: 'Genera un nuevo access token usando el refresh token de la cookie httpOnly.',
  request: {},
  responses: {
    200: {
      description: 'Token renovado exitosamente',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    ...errorResponses('TokenExpiredException', 'NotProvidedTokenException', 'CacheCredentialNotFoundException', 'UnauthorizedException'),
  },
})

// GET /api/v1/auth/check-session
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/check-session',
  tags: ['Auth'],
  summary: 'Verificar sesión activa',
  description: 'Valida que el access token sea válido y comprueba la conexión de la base de datos activa de la sesión.',
  security: [{ BearerAuth: [] }],
  request: {},
  responses: {
    200: {
      description: 'Sesión activa',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    ...errorResponses('TokenExpiredException', 'NotProvidedTokenException', 'CacheCredentialNotFoundException', 'UnauthorizedException'),
  },
})

// POST /api/v1/auth/databases
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/databases',
  tags: ['Auth'],
  summary: 'Listar bases de datos disponibles',
  description:
    'Retorna las bases de datos accesibles en la instancia SQL Server. Acepta dos modos: **post-login** (con Bearer token, las credenciales se obtienen de la sesión) o **pre-login** (sin token, las credenciales se envían en el body).',
  request: {
    body: {
      description: 'Credenciales directas (solo requerido en modo pre-login, sin Bearer token)',
      required: false,
      content: { 'application/json': { schema: ListDatabasesSchema } },
    },
  },
  responses: {
    200: {
      description: 'Lista de bases de datos disponibles',
      content: { 'application/json': { schema: SuccessListResponseSchema } },
    },
    ...errorResponses(
      'InvalidCredentialsException',
      'TokenExpiredException',
      'NotProvidedTokenException',
      'CacheCredentialNotFoundException',
      'ValidationException',
      'UnauthorizedException',
    ),
  },
})

// PATCH /api/v1/auth/switch-database
registry.registerPath({
  method: 'patch',
  path: '/api/v1/auth/switch-database',
  tags: ['Auth'],
  summary: 'Cambiar base de datos activa',
  description:
    'Cambia la base de datos de la sesión actual sin cerrar sesión. Actualiza las credenciales en cache y valida la conexión a la nueva BD.',
  security: [{ BearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: SwitchDatabaseSchema } } },
  },
  responses: {
    200: {
      description: 'Base de datos cambiada exitosamente. Retorna los detalles de la nueva BD.',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    ...errorResponses(
      'InvalidCredentialsException',
      'TokenExpiredException',
      'NotProvidedTokenException',
      'CacheCredentialNotFoundException',
      'ValidationException',
      'UnauthorizedException',
    ),
  },
})
