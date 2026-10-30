import { z } from 'zod'

/**
 * Esquema de entero estricto para DTOs HTTP.
 *
 * Acepta solo un número entero real o una cadena que coincida con /^-?\d+$/.
 * A diferencia de z.coerce.number(), rechaza lo que Number() de otro modo
 * coercionaría: booleanos, arrays, cadenas hexadecimales, cadenas con
 * exponente, cadenas decimales, cadenas con espacios, cadenas vacías, null y
 * undefined.
 *
 * La política de rangos queda en cada consumidor, que puede encadenar límites
 * con strictIntegerSchema.pipe(z.number().min(...).max(...)).
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
