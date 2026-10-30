import { GetSysObjectQuerySchema } from '@sysobject/infrastructure/adapters/drivers/http/get-sysobject/get-sysobject.http-dto'
import { GetSysObjectDependenciesQuerySchema } from '@sysobject/infrastructure/adapters/drivers/http/get-sysobject-dependencies/get-sysobject-dependencies.http-dto'
import { GetSysObjectReferencesQuerySchema } from '@sysobject/infrastructure/adapters/drivers/http/get-sysobject-references/get-sysobject-references.http-dto'
import { GetSysUsertableQuerySchema } from '@sysobject/infrastructure/adapters/drivers/http/get-sysusertable/get-sysusertable.http-dto'
import { describe, expect, it } from 'vitest'

/** Query schemas that all share the same required, trimmed `{ name, schema }` contract. */
const querySchemas = [
  { label: 'GetSysObjectQuerySchema', schema: GetSysObjectQuerySchema },
  { label: 'GetSysObjectDependenciesQuerySchema', schema: GetSysObjectDependenciesQuerySchema },
  { label: 'GetSysObjectReferencesQuerySchema', schema: GetSysObjectReferencesQuerySchema },
  { label: 'GetSysUsertableQuerySchema', schema: GetSysUsertableQuerySchema },
]

describe.each(querySchemas)('$label', ({ schema }) => {
  it('debería aceptar un name y schema válidos', () => {
    expect(schema.safeParse({ name: 'vwOrders', schema: 'dbo' }).success).toBe(true)
  })

  it('debería recortar los espacios alrededor de name y schema', () => {
    const parsed = schema.parse({ name: '  vwOrders  ', schema: '  dbo  ' })

    expect(parsed.name).toBe('vwOrders')
    expect(parsed.schema).toBe('dbo')
  })

  it('debería rechazar un name o schema vacíos', () => {
    expect(schema.safeParse({ name: '', schema: 'dbo' }).success).toBe(false)
    expect(schema.safeParse({ name: 'vwOrders', schema: '' }).success).toBe(false)
  })

  it('debería rechazar un name o schema con solo espacios', () => {
    expect(schema.safeParse({ name: '   ', schema: 'dbo' }).success).toBe(false)
    expect(schema.safeParse({ name: 'vwOrders', schema: '   ' }).success).toBe(false)
  })
})
