import { strictIntegerSchema } from '@shared/infrastructure/schemas/strict-integer'
import { describe, expect, it } from 'vitest'

describe('strictIntegerSchema', () => {
  describe('valores aceptados', () => {
    it('debería aceptar números enteros reales, incluidos negativos y cero', () => {
      expect(strictIntegerSchema.parse(5)).toBe(5)
      expect(strictIntegerSchema.parse(-3)).toBe(-3)
      expect(strictIntegerSchema.parse(0)).toBe(0)
    })

    it('debería convertir cadenas de dígitos, incluidas negativas y cero', () => {
      expect(strictIntegerSchema.parse('7')).toBe(7)
      expect(strictIntegerSchema.parse('-3')).toBe(-3)
      expect(strictIntegerSchema.parse('0')).toBe(0)
    })
  })

  describe('valores rechazados', () => {
    it('debería rechazar booleanos', () => {
      expect(strictIntegerSchema.safeParse(true).success).toBe(false)
      expect(strictIntegerSchema.safeParse(false).success).toBe(false)
    })

    it('debería rechazar arreglos, incluidos los de un solo elemento', () => {
      expect(strictIntegerSchema.safeParse(['5']).success).toBe(false)
      expect(strictIntegerSchema.safeParse([5]).success).toBe(false)
    })

    it('debería rechazar cadenas hexadecimales y exponenciales', () => {
      expect(strictIntegerSchema.safeParse('0x10').success).toBe(false)
      expect(strictIntegerSchema.safeParse('1e2').success).toBe(false)
    })

    it('debería rechazar decimales y números no enteros', () => {
      expect(strictIntegerSchema.safeParse('2.5').success).toBe(false)
      expect(strictIntegerSchema.safeParse(1.5).success).toBe(false)
    })

    it('debería rechazar cadenas con espacios y cadenas vacías', () => {
      expect(strictIntegerSchema.safeParse(' 5 ').success).toBe(false)
      expect(strictIntegerSchema.safeParse('').success).toBe(false)
    })

    it('debería rechazar null y undefined', () => {
      expect(strictIntegerSchema.safeParse(null).success).toBe(false)
      expect(strictIntegerSchema.safeParse(undefined).success).toBe(false)
    })
  })
})
