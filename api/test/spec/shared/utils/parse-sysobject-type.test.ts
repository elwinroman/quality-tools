import { parseSqlObjectTypeCondition } from '@core/utils/parse-sysobject-type.util'
import { TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'
import { describe, expect, it } from 'vitest'

describe('parseSqlObjectTypeCondition', () => {
  describe('tipo específico', () => {
    it('debería devolver un único tipo entre comillas', () => {
      expect(parseSqlObjectTypeCondition(TypeSysObjectEnum.VIEW)).toBe("'V'")
    })

    it('debería devolver las tablas de usuario cuando se piden explícitamente', () => {
      expect(parseSqlObjectTypeCondition(TypeSysObjectEnum.USER_TABLE)).toBe("'U'")
    })

    it('debería cubrir todos los tipos concretos del enum', () => {
      const concretos = [
        TypeSysObjectEnum.SQL_STORED_PROCEDURE,
        TypeSysObjectEnum.SQL_SCALAR_FUNCTION,
        TypeSysObjectEnum.SQL_TRIGGER,
        TypeSysObjectEnum.SQL_TABLE_VALUED_FUNCTION,
        TypeSysObjectEnum.SQL_INLINE_TABLE_VALUED_FUNCTION,
        TypeSysObjectEnum.VIEW,
        TypeSysObjectEnum.USER_TABLE,
      ]

      concretos.forEach(tipo => {
        expect(parseSqlObjectTypeCondition(tipo)).toBe(`'${tipo}'`)
      })
    })
  })

  describe('agregado ALL', () => {
    it('debería devolver todos los tipos válidos en el orden del enum', () => {
      expect(parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL)).toBe("'P', 'FN', 'TR', 'TF', 'IF', 'V', 'U'")
    })

    it('no debería incluir los agregados en la lista', () => {
      const resultado = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL)

      expect(resultado).not.toContain("'ALL'")
      expect(resultado).not.toContain("'ALL_EXCEPT_USERTABLE'")
    })
  })

  describe('agregado ALL_EXCEPT_USERTABLE', () => {
    it('debería excluir las tablas de usuario', () => {
      expect(parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL_EXCEPT_USERTABLE)).toBe("'P', 'FN', 'TR', 'TF', 'IF', 'V'")
    })

    it('debería devolver un tipo menos que ALL', () => {
      const todos = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL).split(', ')
      const sinUsertable = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL_EXCEPT_USERTABLE).split(', ')

      expect(sinUsertable).toHaveLength(todos.length - 1)
    })
  })

  describe('formato para la cláusula IN', () => {
    it('debería separar los tipos con coma y espacio', () => {
      expect(parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL).split(', ')).toHaveLength(7)
    })

    it('debería envolver cada tipo en comillas simples', () => {
      const resultado = parseSqlObjectTypeCondition(TypeSysObjectEnum.ALL)

      resultado.split(', ').forEach(tipo => {
        expect(tipo).toMatch(/^'[A-Z]+'$/)
      })
    })
  })
})
