import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

export function buildOtelResource(serviceName: string, deploymentEnvironment: string, resourceAttributes: string) {
  return resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    ...parseResourceAttributes(resourceAttributes),
    // Se fuerza desde OTEL_DEPLOYMENT_ENV para evitar mezclar logs entre ambientes.
    'deployment.environment': deploymentEnvironment,
  })
}

function parseResourceAttributes(resourceAttributes: string): Record<string, string> {
  if (!resourceAttributes.trim()) return {}

  return resourceAttributes.split(',').reduce<Record<string, string>>((attributes, pair) => {
    const [rawKey, ...rawValueParts] = pair.split('=')
    const key = rawKey?.trim()
    const value = rawValueParts.join('=').trim()

    if (key && value) attributes[key] = value
    return attributes
  }, {})
}
