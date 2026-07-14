import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { registry } from '@core/swagger/openapi-registry'
import { errorResponses, SuccessResponseSchema } from '@core/swagger/schemas'
import { z } from 'zod'

import { GetProdSysObjectParamsSchema } from './get-prod-sysobject/get-prod-sysobject.http-dto'
import { GetSysObjectQuerySchema } from './get-sysobject/get-sysobject.http-dto'
import { GetSysObjectDependenciesQuerySchema } from './get-sysobject-dependencies/get-sysobject-dependencies.http-dto'
import { GetSysObjectReferencesQuerySchema } from './get-sysobject-references/get-sysobject-references.http-dto'
import { GetSysUsertableQuerySchema } from './get-sysusertable/get-sysusertable.http-dto'
import { SearchSuggestionQuerySchema } from './search-suggestions/search-suggestion.http-dto'

extendZodWithOpenApi(z)

// GET /api/v1/sysobject/search
registry.registerPath({
  method: 'get',
  path: '/api/v1/sysobject/search',
  tags: ['SysObject'],
  summary: 'Buscar sugerencias de objetos SQL',
  description: 'Busca objetos SQL Server por nombre parcial y tipo. Requiere autenticación.',
  security: [{ BearerAuth: [] }],
  request: {
    query: SearchSuggestionQuerySchema,
  },
  responses: {
    200: {
      description: 'Lista de sugerencias encontradas',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    ...errorResponses('UnauthorizedException', 'ValidationException'),
  },
})

// GET /api/v1/sysobject/prod
registry.registerPath({
  method: 'get',
  path: '/api/v1/sysobject/prod',
  tags: ['SysObject'],
  summary: 'Obtener objeto SQL de producción',
  description: 'Obtiene la definición de un objeto SQL desde el servidor de producción. No requiere autenticación obligatoria.',
  request: {
    query: GetProdSysObjectParamsSchema,
  },
  responses: {
    200: {
      description: 'Definición del objeto SQL de producción',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    ...errorResponses('ProdSysObjectNotFoundException', 'ValidationException'),
  },
})

// GET /api/v1/sysobject/by-name
registry.registerPath({
  method: 'get',
  path: '/api/v1/sysobject/by-name',
  tags: ['SysObject'],
  summary: 'Obtener objeto SQL por esquema y nombre',
  description: 'Obtiene la definición completa de un objeto SQL por esquema y nombre. Requiere autenticación.',
  security: [{ BearerAuth: [] }],
  request: {
    query: GetSysObjectQuerySchema,
  },
  responses: {
    200: {
      description: 'Definición del objeto SQL',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    ...errorResponses('SysObjectNotFoundException', 'UnauthorizedException', 'ValidationException'),
  },
})

// GET /api/v1/sysobject/references
registry.registerPath({
  method: 'get',
  path: '/api/v1/sysobject/references',
  tags: ['SysObject'],
  summary: 'Obtener referencias de un objeto SQL',
  description: 'Obtiene los objetos que referencian al objeto SQL indicado por esquema y nombre. Requiere autenticación.',
  security: [{ BearerAuth: [] }],
  request: {
    query: GetSysObjectReferencesQuerySchema,
  },
  responses: {
    200: {
      description: 'Lista de objetos que referencian al objeto SQL',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    ...errorResponses('UnauthorizedException', 'ValidationException'),
  },
})

// GET /api/v1/sysobject/dependencies
registry.registerPath({
  method: 'get',
  path: '/api/v1/sysobject/dependencies',
  tags: ['SysObject'],
  summary: 'Obtener dependencias de un objeto SQL',
  description: 'Obtiene los objetos usados por el objeto SQL indicado por esquema y nombre. Requiere autenticación.',
  security: [{ BearerAuth: [] }],
  request: {
    query: GetSysObjectDependenciesQuerySchema,
  },
  responses: {
    200: {
      description: 'Lista de dependencias del objeto SQL',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    ...errorResponses('UnauthorizedException', 'ValidationException'),
  },
})

// GET /api/v1/sysobject/usertable/by-name
registry.registerPath({
  method: 'get',
  path: '/api/v1/sysobject/usertable/by-name',
  tags: ['SysObject'],
  summary: 'Obtener tabla de usuario por esquema y nombre',
  description: 'Obtiene la estructura de una tabla de usuario (USER_TABLE) por esquema y nombre. Requiere autenticación.',
  security: [{ BearerAuth: [] }],
  request: {
    query: GetSysUsertableQuerySchema,
  },
  responses: {
    200: {
      description: 'Estructura de la tabla de usuario',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    ...errorResponses('SysObjectNotFoundException', 'UnauthorizedException', 'ValidationException'),
  },
})
