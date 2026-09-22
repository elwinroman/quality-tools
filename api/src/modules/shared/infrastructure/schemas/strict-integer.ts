import { z } from 'zod'

/**
 * Strict integer schema for HTTP DTOs.
 *
 * Accepts only a real integer number or a string matching /^-?\d+$/.
 * Unlike z.coerce.number(), it rejects what Number() would otherwise
 * coerce: booleans, arrays, hex strings, exponent strings, decimal
 * strings, whitespace-padded strings, empty strings, null and undefined.
 *
 * Range policy stays with each consumer, which can chain bounds with
 * strictIntegerSchema.pipe(z.number().min(...).max(...)).
 */
export const strictIntegerSchema = z.union(
  [
    z.number().int(),
    z
      .string()
      .regex(/^-?\d+$/)
      .transform(Number),
  ],
  {
    errorMap: () => ({ message: 'El valor debe ser un número entero' }),
  },
)
