import { parseSqlObjectTypeCondition } from '@core/utils/parse-sysobject-type.util'
import { TypeSysObjectEnum, ValidTypeSysObjectValues } from '@sysobject/domain/schemas/sysobject'
import { describe, expect, it } from 'vitest'

/** Formatea los tipos como viajan en la cláusula IN, derivado del enum. */
function comoCondicionIn(tipos: readonly string[]): string[] {
  return tipos.map(tipo => `'${tipo}'`)
}

describe('parseSqlObjectTypeCondition', () => {
  describe('tipo específico', () => {
    it('debería devolver un único tipo entre comillas', () => {
      expect(parseSqlObjectTypeCondition(TypeSysObjectEnum.VIEW)).toBe(`'${TypeSysObjectEnum.VIEW}'`)
    })

    it('debería cubrir todos los tipos concretos del enum', () => {
      ValidTypeSysObjectValues.forEach(tipo => {
        expect(parseSqlObjectTypeCondition(tipo)).toBe(`'${tipo}'`)
      })
    })
  })

  describe('agregado ALL', () => {
    it('debería devolver todos los tipos concretos del enum', () => {
      const resultado = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL).split(', ')

      expect(resultado).toEqual(comoCondicionIn(ValidTypeSysObjectValues))
    })
  })

  describe('agregado ALL_EXCEPT_USERTABLE', () => {
    it('debería excluir las tablas de usuario', () => {
      const sinTablasDeUsuario = ValidTypeSysObjectValues.filter(tipo => tipo !== TypeSysObjectEnum.USER_TABLE)
      const resultado = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL_EXCEPT_USERTABLE).split(', ')

      expect(resultado).toEqual(comoCondicionIn(sinTablasDeUsuario))
    })
  })
})
