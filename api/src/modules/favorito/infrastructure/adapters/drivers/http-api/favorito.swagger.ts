import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { registry } from '@core/swagger/openapi-registry'
import { DeleteResponseSchema, errorResponses, SuccessListResponseSchema, SuccessMessageResponseSchema } from '@core/swagger/schemas'
import { z } from 'zod'

import { GetAllFavoritosQuerySchema } from './controllers/get-all-favoritos/get-all-favoritos-query.http-dto'
import { RegisterFavoritoParamsSchema } from './controllers/register-favorito/register-favorito-params.http-dto'

extendZodWithOpenApi(z)

// PUT /api/v1/favorito
registry.registerPath({
  method: 'put',
  path: '/api/v1/favorito',
  tags: ['Favorito'],
  summary: 'Marcar o desmarcar un favorito',
  description:
    'Fija el estado de un objeto SQL como favorito del usuario autenticado. Con isActive en true lo marca, o lo reactiva si estaba desmarcado; con false lo desmarca. Es idempotente: si el estado pedido ya era el actual, responde 200 con data en null.',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterFavoritoParamsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Estado del favorito aplicado (creado, reactivado, desmarcado o sin cambios)',
      content: { 'application/json': { schema: SuccessMessageResponseSchema } },
    },
    ...errorResponses('UnauthorizedException', 'ValidationException'),
  },
})

// GET /api/v1/favorito
registry.registerPath({
  method: 'get',
  path: '/api/v1/favorito',
  tags: ['Favorito'],
  summary: 'Obtener favoritos del usuario',
  description: 'Lista los favoritos del usuario autenticado, filtrados por tipo y limitados por cantidad.',
  security: [{ BearerAuth: [] }],
  request: {
    query: GetAllFavoritosQuerySchema,
  },
  responses: {
    200: {
      description: 'Lista de favoritos',
      content: { 'application/json': { schema: SuccessListResponseSchema } },
    },
    ...errorResponses('UnauthorizedException', 'ValidationException'),
  },
})
