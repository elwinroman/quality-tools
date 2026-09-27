import { decodeRow, decodeRows } from '@core/utils/decode-recordset.util'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const RowSchema = z.object({
  id: z.number().int(),
  name: z.string(),
})

type Row = z.infer<typeof RowSchema>

function buildRow(overrides: Partial<Row> = {}): Row {
  return {
    id: 1,
    name: 'vw_orders',
    ...overrides,
  }
}

describe('decodeRow', () => {
  it('debería devolver null cuando la consulta no trae filas', () => {
    expect(decodeRow([], RowSchema)).toBeNull()
    expect(decodeRow(undefined, RowSchema)).toBeNull()
  })

  it('debería devolver la fila validada cuando la forma coincide', () => {
    expect(decodeRow([buildRow()], RowSchema)).toEqual(buildRow())
  })

  it('debería lanzar cuando la fila existe pero no coincide con el schema', () => {
    expect(() => decodeRow([{ ...buildRow(), id: '1' }], RowSchema)).toThrow()
  })
})

describe('decodeRows', () => {
  it('debería devolver una lista vacía cuando no hay filas', () => {
    expect(decodeRows(undefined, RowSchema)).toEqual([])
  })

  it('debería validar cada fila de la lista', () => {
    expect(decodeRows([buildRow()], RowSchema)).toEqual([buildRow()])
    expect(() => decodeRows([{ ...buildRow(), name: 1 }], RowSchema)).toThrow()
  })
})
