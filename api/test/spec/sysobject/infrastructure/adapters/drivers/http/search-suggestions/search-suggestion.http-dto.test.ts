import { TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'
import { SearchSuggestionQuerySchema } from '@sysobject/infrastructure/adapters/drivers/http/search-suggestions/search-suggestion.http-dto'
import { describe, expect, it } from 'vitest'

describe('SearchSuggestionQuerySchema', () => {
  describe('normalización de name', () => {
    it('debería recortar los espacios alrededor del nombre', () => {
      expect(SearchSuggestionQuerySchema.parse({ name: '  dbo.vwOrders  ', type: TypeSysObjectEnum.VIEW }).name).toBe('dbo.vwOrders')
    })
  })

  describe('límites de name', () => {
    it('debería aceptar los bordes de 3 y 128 caracteres', () => {
      expect(SearchSuggestionQuerySchema.safeParse({ name: 'abc', type: TypeSysObjectEnum.VIEW }).success).toBe(true)
      expect(SearchSuggestionQuerySchema.safeParse({ name: 'a'.repeat(128), type: TypeSysObjectEnum.VIEW }).success).toBe(true)
    })

    it('debería rechazar un nombre más corto que 3 o más largo que 128', () => {
      expect(SearchSuggestionQuerySchema.safeParse({ name: 'ab', type: TypeSysObjectEnum.VIEW }).success).toBe(false)
      expect(SearchSuggestionQuerySchema.safeParse({ name: 'a'.repeat(129), type: TypeSysObjectEnum.VIEW }).success).toBe(false)
    })

    it('debería rechazar un nombre que queda corto después de recortar', () => {
      expect(SearchSuggestionQuerySchema.safeParse({ name: '  ab  ', type: TypeSysObjectEnum.VIEW }).success).toBe(false)
    })
  })

  describe('normalización de type', () => {
    it('debería convertir el tipo a mayúsculas', () => {
      const parsed = SearchSuggestionQuerySchema.parse({
        name: 'abc',
        type: TypeSysObjectEnum.SQL_SCALAR_FUNCTION.toLowerCase(),
      })

      expect(parsed.type).toBe(TypeSysObjectEnum.SQL_SCALAR_FUNCTION)
    })

    it('debería aceptar todos los valores del enum', () => {
      Object.values(TypeSysObjectEnum).forEach(tipo => {
        expect(SearchSuggestionQuerySchema.parse({ name: 'abc', type: tipo.toLowerCase() }).type).toBe(tipo)
      })
    })
  })

  describe('rechazo de type', () => {
    it('debería rechazar un tipo que no pertenece al enum', () => {
      expect(SearchSuggestionQuerySchema.safeParse({ name: 'abc', type: 'VIEW' }).success).toBe(false)
    })

    it('debería rechazar un tipo que no es texto', () => {
      expect(SearchSuggestionQuerySchema.safeParse({ name: 'abc', type: 1 }).success).toBe(false)
    })
  })

  describe('campos requeridos', () => {
    it('debería rechazar la ausencia de name o type', () => {
      expect(SearchSuggestionQuerySchema.safeParse({ type: TypeSysObjectEnum.VIEW }).success).toBe(false)
      expect(SearchSuggestionQuerySchema.safeParse({ name: 'abc' }).success).toBe(false)
    })
  })
})
