import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'

import { registry } from './openapi-registry'

// Registrar security scheme
registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Access token JWT obtenido del endpoint /api/v1/auth/login',
})

// Registrar specs de cada módulo (side-effects)
import '@auth/infrastructure/adapters/drivers/http-api/auth.swagger'
import '@busqueda-reciente/infrastructure/adapters/drivers/http-api/busqueda-reciente.swagger'
import '@favorito/infrastructure/adapters/drivers/http-api/favorito.swagger'
import '@sysobject/infrastructure/adapters/drivers/http/sysobject.swagger'
import '@/modules/health/infrastructure/adapters/drivers/http/health.swagger'

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Quality Tools API',
      version: '1.0.0',
      description: 'API REST interna para Quality Tools — gestión de objetos SQL Server, favoritos, búsquedas recientes y autenticación.',
    },
    servers: [{ url: '/', description: 'Servidor actual' }],
  })
}
