import { describe, expect, it } from 'vitest'

import { QueryStoreUnavailableException } from '@/modules/performance/application/exceptions/query-store-unavailable.exception'
import { QueryStoreActualStateList } from '@/modules/performance/domain/query-store-options'

describe('QueryStoreUnavailableException', () => {
  it('exposes the shared 409 metadata', () => {
    const error = new QueryStoreUnavailableException('missing_configuration')

    expect(error).toMatchObject({
      type: 'QueryStoreUnavailableException',
      status: 409,
      errorCode: 6000,
    })
  })

  it('explains a missing configuration', () => {
    const error = new QueryStoreUnavailableException('missing_configuration')

    expect(error.detail).toContain('configuración')
  })

  it('distinguishes OFF from ERROR', () => {
    const off = new QueryStoreUnavailableException(QueryStoreActualStateList.OFF)
    const failure = new QueryStoreUnavailableException(QueryStoreActualStateList.ERROR)

    expect(off.detail).toContain('desactivado')
    expect(failure.detail).toContain('error')
    expect(off.detail).not.toBe(failure.detail)
  })

  it('falls back for an unknown engine state', () => {
    const error = new QueryStoreUnavailableException('NEW_ENGINE_STATE')

    expect(error.detail).toContain('NEW_ENGINE_STATE')
  })
})
