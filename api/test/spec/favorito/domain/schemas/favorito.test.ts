import { FavoriteScopeContext, resolveFavoriteScope } from '@favorito/domain/schemas/favorito'
import { describe, expect, it } from 'vitest'

const CONTEXT: FavoriteScopeContext = {
  serverName: 'SRV_PROD',
  databaseName: 'RRHH',
}

describe('resolveFavoriteScope', () => {
  describe('alcance global', () => {
    it('debería resolver a ambos nombres en null sin importar el contexto', () => {
      expect(resolveFavoriteScope('global', CONTEXT)).toEqual({ serverName: null, databaseName: null })
    })
  })

  describe('alcance por servidor', () => {
    it('debería conservar el servidor y dejar la base en null', () => {
      expect(resolveFavoriteScope('server', CONTEXT)).toEqual({ serverName: 'SRV_PROD', databaseName: null })
    })
  })

  describe('alcance por base', () => {
    it('debería conservar servidor y base del contexto', () => {
      expect(resolveFavoriteScope('database', CONTEXT)).toEqual({ serverName: 'SRV_PROD', databaseName: 'RRHH' })
    })
  })
})
