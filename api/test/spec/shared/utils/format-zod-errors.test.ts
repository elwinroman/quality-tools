import { formatZodErrors } from '@core/utils/format-zod-errors.util'
import { describe, expect, it } from 'vitest'
import { ZodIssue } from 'zod'

describe('formatZodErrors', () => {
  it('debería unir la ruta del issue con puntos', () => {
    const issues: ZodIssue[] = [
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined',
        path: ['body', 'database'],
        message: 'Required',
      },
    ]

    expect(formatZodErrors(issues)).toEqual(['body.database: Required'])
  })

  it('debería formatear la ruta de arreglos con su índice', () => {
    const issues: ZodIssue[] = [
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['items', 2, 'name'],
        message: 'Expected string',
      },
    ]

    expect(formatZodErrors(issues)).toEqual(['items.2.name: Expected string'])
  })

  it('debería dejar el prefijo vacío cuando el issue no tiene ruta', () => {
    const issues: ZodIssue[] = [
      {
        code: 'custom',
        path: [],
        message: 'Los datos son inconsistentes',
      },
    ]

    // Ruta vacía: el `join('.')` devuelve '' y el mensaje queda con los dos
    // puntos al inicio. Es el formato actual de los errores a nivel raíz.
    expect(formatZodErrors(issues)).toEqual([': Los datos son inconsistentes'])
  })

  it('debería preservar el orden de los issues', () => {
    const issues: ZodIssue[] = [
      { code: 'custom', path: ['primero'], message: 'A' },
      { code: 'custom', path: ['segundo'], message: 'B' },
      { code: 'custom', path: ['tercero'], message: 'C' },
    ]

    expect(formatZodErrors(issues)).toEqual(['primero: A', 'segundo: B', 'tercero: C'])
  })

  it('debería devolver un arreglo vacío cuando no hay issues', () => {
    expect(formatZodErrors([])).toEqual([])
  })
})
