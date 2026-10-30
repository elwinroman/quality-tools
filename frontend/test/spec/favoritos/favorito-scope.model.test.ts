import { describe, expect, it } from 'vitest'

import { scopeKindFrom, scopeRank } from '@/components/favoritos/models/favorito.model'

describe('scopeKindFrom', () => {
  it('devuelve global cuando servidor y base son nulos', () => {
    expect(scopeKindFrom({ serverName: null, databaseName: null })).toBe('global')
  })

  it('devuelve server cuando solo hay servidor', () => {
    expect(scopeKindFrom({ serverName: 'SRV_PROD', databaseName: null })).toBe('server')
  })

  it('devuelve database cuando hay servidor y base', () => {
    expect(scopeKindFrom({ serverName: 'SRV_PROD', databaseName: 'RRHH' })).toBe('database')
  })
})

describe('scopeRank', () => {
  it('ordena global < server < database', () => {
    const global = scopeRank({ serverName: null, databaseName: null })
    const server = scopeRank({ serverName: 'SRV', databaseName: null })
    const database = scopeRank({ serverName: 'SRV', databaseName: 'RRHH' })

    expect(global).toBe(0)
    expect(server).toBe(1)
    expect(database).toBe(2)
    expect(global).toBeLessThan(server)
    expect(server).toBeLessThan(database)
  })
})
