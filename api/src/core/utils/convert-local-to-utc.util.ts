import { offset, removeOffset } from '@formkit/tempo'

/**
 * Convierte una fecha desde una zona horaria local a UTC.
 *
 * @param date - Fecha a convertir (puede ser un string o un objeto Date).
 * @param timeZone - Zona horaria de origen (ej. "America/Lima").
 * @returns {Date} - La fecha convertida en UTC.
 *
 * @throws {Error} - Si la fecha es inválida o el tipo de dato no es soportado.
 *
 * @example
 * convertLocalToUTC('2025-09-07T08:00:00', 'America/Lima')
 * // Retorna la fecha equivalente en UTC
 */
export function convertLocalToUTC(date: unknown, timeZone: string): Date {
  if (typeof date !== 'string' && !(date instanceof Date)) {
    throw new Error(`Tipo no válido para fecha: ${typeof date}`)
  }

  const wallClock = typeof date === 'string' ? anchorISOToUTC(date) : date

  if (isNaN(new Date(wallClock).getTime())) throw new Error(`Fecha inválida: ${date}`)

  const offsetToUTC = offset(wallClock, 'UTC', timeZone)

  return removeOffset(wallClock, offsetToUTC)
}

/**
 * Anchors a timezone-less ISO 8601 string to UTC. The value is a wall clock, so
 * letting it be parsed as a host-local instant would make the result depend on
 * the timezone of the machine running the process.
 */
function anchorISOToUTC(value: string): string {
  const trimmed = value.trim()
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) return trimmed

  return trimmed.includes('T') ? `${trimmed}Z` : `${trimmed}T00:00:00Z`
}
