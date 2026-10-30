import { resolveTypeSysObjectValues, TypeSysObjectEnum, ValidTypeSysObjectValues } from '@sysobject/domain/schemas/sysobject'
import { describe, expect, it } from 'vitest'

describe('resolveTypeSysObjectValues', () => {
  describe('tipo concreto', () => {
    it('debería devolver únicamente ese tipo', () => {
      expect(resolveTypeSysObjectValues(TypeSysObjectEnum.VIEW)).toEqual([TypeSysObjectEnum.VIEW])
    })
  })

  describe('agregado ALL', () => {
    it('debería devolver todos los tipos válidos', () => {
      expect(resolveTypeSysObjectValues(TypeSysObjectEnum.ALL)).toEqual(ValidTypeSysObjectValues)
    })

    it('no debería exponer el arreglo compartido del módulo', () => {
      const first = resolveTypeSysObjectValues(TypeSysObjectEnum.ALL)
      const second = resolveTypeSysObjectValues(TypeSysObjectEnum.ALL)

      expect(first).not.toBe(second)
    })

    it('debería aislar las mutaciones del llamador', () => {
      // With the shared reference, a caller doing .push() or .sort() would corrupt
      // the module constant for the whole process.
      const expected = [...ValidTypeSysObjectValues]

      resolveTypeSysObjectValues(TypeSysObjectEnum.ALL).push(TypeSysObjectEnum.VIEW)

      expect(resolveTypeSysObjectValues(TypeSysObjectEnum.ALL)).toEqual(expected)
    })
  })

  describe('agregado ALL_EXCEPT_USERTABLE', () => {
    it('debería excluir las tablas de usuario', () => {
      const result = resolveTypeSysObjectValues(TypeSysObjectEnum.ALL_EXCEPT_USERTABLE)

      expect(result).not.toContain(TypeSysObjectEnum.USER_TABLE)
      expect(result).toHaveLength(ValidTypeSysObjectValues.length - 1)
    })
  })
})
