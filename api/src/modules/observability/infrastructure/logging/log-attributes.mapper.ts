import { Context } from '@observability/domain/logger'

import { getRequestLogContext } from '../context/request-log-context.storage'

/**
 * Une el contexto tecnico de la request con el contexto puntual del evento.
 * Esto evita pasar correlationId/source/auth/user/session manualmente en cada log.
 */
export function buildLogContext(context?: Context): Context {
  const loggerContext = getRequestLogContext()
  const { request: _request, ...requestContext } = loggerContext ?? {}

  return {
    ...(requestContext || {}),
    ...(context || {}),
  }
}

export type LogAttributeValue = string | number | boolean
export type LogAttributes = Record<string, LogAttributeValue>

/**
 * OpenTelemetry/Loki trabajan mejor con atributos primitivos.
 * Este mapper convierte objetos anidados en atributos planos, sin convertirlos en labels.
 */
export function flattenLogAttributes(input: Context): LogAttributes {
  return flattenObject(input)
}

function flattenObject(input: unknown, prefix = ''): LogAttributes {
  if (!isRecord(input)) return {}

  return Object.entries(input).reduce<LogAttributes>((attributes, [key, value]) => {
    const attributeKey = prefix ? `${prefix}.${key}` : key

    if (value === undefined) return attributes

    // Error necesita tratamiento explicito para no perder message/stack en serializacion.
    if (value instanceof Error) {
      attributes[`${attributeKey}.name`] = value.name
      attributes[`${attributeKey}.message`] = value.message
      if (value.stack) attributes[`${attributeKey}.stack`] = value.stack
      return attributes
    }

    if (value instanceof Date) {
      attributes[attributeKey] = value.toISOString()
      return attributes
    }

    // Arrays se guardan como JSON string para mantener el atributo como valor primitivo.
    if (Array.isArray(value)) {
      attributes[attributeKey] = JSON.stringify(value)
      return attributes
    }

    if (isRecord(value)) {
      return {
        ...attributes,
        ...flattenObject(value, attributeKey),
      }
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      attributes[attributeKey] = value
    } else {
      attributes[attributeKey] = String(value)
    }
    return attributes
  }, {})
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
