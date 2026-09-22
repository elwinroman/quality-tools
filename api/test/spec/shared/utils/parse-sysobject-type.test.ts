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

    it('debería devolver las tablas de usuario cuando se piden explícitamente', () => {
      expect(parseSqlObjectTypeCondition(TypeSysObjectEnum.USER_TABLE)).toBe(`'${TypeSysObjectEnum.USER_TABLE}'`)
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

    it('no debería incluir los agregados en la lista', () => {
      const resultado = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL)

      expect(resultado).not.toContain(`'${TypeSysObjectEnum.ALL}'`)
      expect(resultado).not.toContain(`'${TypeSysObjectEnum.ALL_EXCEPT_USERTABLE}'`)
    })
  })

  describe('agregado ALL_EXCEPT_USERTABLE', () => {
    it('debería excluir las tablas de usuario', () => {
      const sinTablasDeUsuario = ValidTypeSysObjectValues.filter(tipo => tipo !== TypeSysObjectEnum.USER_TABLE)
      const resultado = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL_EXCEPT_USERTABLE).split(', ')

      expect(resultado).toEqual(comoCondicionIn(sinTablasDeUsuario))
    })

    it('debería devolver un tipo menos que ALL', () => {
      const todos = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL).split(', ')
      const sinUsertable = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL_EXCEPT_USERTABLE).split(', ')

      expect(sinUsertable).toHaveLength(todos.length - 1)
    })
  })

  describe('formato para la cláusula IN', () => {
    it('debería separar todos los tipos con coma y espacio', () => {
      expect(parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL).split(', ')).toHaveLength(ValidTypeSysObjectValues.length)
    })

    it('debería envolver cada tipo en comillas simples', () => {
      const resultado = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL)

      resultado.split(', ').forEach(tipo => {
        expect(tipo).toMatch(/^'[A-Z_]+'$/)
      })
    })
  })
})
