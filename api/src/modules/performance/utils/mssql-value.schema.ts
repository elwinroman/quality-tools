import { z } from 'zod'

const RawMssqlNumericSchema = z.union([z.number(), z.string()])
const CANONICAL_NON_NEGATIVE_INTEGER = /^(0|[1-9]\d*)$/
const CANONICAL_POSITIVE_INTEGER = /^[1-9]\d*$/
const CANONICAL_NON_NEGATIVE_DECIMAL = /^(0|[1-9]\d*)(\.\d+)?$/
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)

function invalidNumeric(context: z.RefinementCtx, message: string): never {
  context.addIssue({ code: z.ZodIssueCode.custom, message })
  return z.NEVER
}

function parseSafeInteger(value: number | string, positive: boolean, context: z.RefinementCtx): number {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || (positive ? value <= 0 : value < 0)) {
      return invalidNumeric(context, positive ? 'Expected a positive safe integer' : 'Expected a non-negative safe integer')
    }
    return value
  }

  const pattern = positive ? CANONICAL_POSITIVE_INTEGER : CANONICAL_NON_NEGATIVE_INTEGER
  if (!pattern.test(value)) {
    return invalidNumeric(context, positive ? 'Expected canonical positive integer text' : 'Expected canonical non-negative integer text')
  }

  // BigInt valida el rango exacto antes de convertir; Number podría redondear texto entero inseguro.
  const exactValue = BigInt(value)
  if (exactValue > MAX_SAFE_INTEGER_BIGINT) return invalidNumeric(context, 'Integer exceeds the JavaScript safe range')
  return Number(exactValue)
}

function parseFiniteDecimal(value: number | string, context: z.RefinementCtx): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return invalidNumeric(context, 'Expected a finite non-negative number')
    return value
  }

  if (!CANONICAL_NON_NEGATIVE_DECIMAL.test(value)) {
    return invalidNumeric(context, 'Expected canonical non-negative decimal text')
  }
  // La validación léxica previa excluye exponentes, signos y formatos ambiguos antes de usar Number.
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return invalidNumeric(context, 'Decimal exceeds the finite JavaScript range')
  return parsed
}

export const MssqlNonNegativeSafeIntegerSchema = RawMssqlNumericSchema.transform((value, context) =>
  parseSafeInteger(value, false, context),
)

export const MssqlPositiveSafeIntegerSchema = RawMssqlNumericSchema.transform((value, context) => parseSafeInteger(value, true, context))

export const MssqlNonNegativeFiniteNumberSchema = RawMssqlNumericSchema.transform(parseFiniteDecimal)

/**
 * Decodifica un JSON NVARCHAR con textos enteros positivos, canónicos y distintos.
 * Los elementos son strings para conservar cada dígito hasta validar con BigInt antes de convertir a Number.
 */
export const MssqlDistinctPositiveIntegerJsonArraySchema = z.string().transform((value, context): number[] => {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return invalidNumeric(context, 'Execution-count clusters must be valid JSON')
  }

  if (!Array.isArray(parsed) || !parsed.every(cluster => typeof cluster === 'string')) {
    return invalidNumeric(context, 'Execution-count clusters must be a JSON array of canonical integer strings')
  }

  const values: number[] = []
  for (const item of parsed) {
    if (!CANONICAL_POSITIVE_INTEGER.test(item)) {
      return invalidNumeric(context, 'Execution-count clusters must contain canonical positive-integer strings')
    }
    const exactValue = BigInt(item)
    if (exactValue > MAX_SAFE_INTEGER_BIGINT) {
      return invalidNumeric(context, 'Execution-count cluster exceeds the JavaScript safe range')
    }
    values.push(Number(exactValue))
  }

  if (new Set(values).size !== values.length) {
    return invalidNumeric(context, 'Execution-count clusters must be distinct')
  }
  return values
})
