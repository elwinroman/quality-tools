import { formatSQLDataType } from '@sysobject/infrastructure/utils/format-sql-data-type.util'
import { describe, expect, it } from 'vitest'

describe('formatSQLDataType', () => {
  describe('tipos de longitud variable', () => {
    it('debería formatear varchar y char con su longitud', () => {
      expect(formatSQLDataType('varchar', 50, 0, 0)).toBe('varchar(50)')
      expect(formatSQLDataType('char', 10, 0, 0)).toBe('char(10)')
    })

    it('debería formatear varchar y char con MAX cuando la longitud es -1', () => {
      expect(formatSQLDataType('varchar', -1, 0, 0)).toBe('varchar(MAX)')
      expect(formatSQLDataType('char', -1, 0, 0)).toBe('char(MAX)')
    })

    it('debería convertir bytes a caracteres en nvarchar y nchar', () => {
      expect(formatSQLDataType('nvarchar', 100, 0, 0)).toBe('nvarchar(50)')
      expect(formatSQLDataType('nchar', 20, 0, 0)).toBe('nchar(10)')
    })

    it('debería formatear nvarchar y nchar con MAX cuando la longitud es -1', () => {
      expect(formatSQLDataType('nvarchar', -1, 0, 0)).toBe('nvarchar(MAX)')
      expect(formatSQLDataType('nchar', -1, 0, 0)).toBe('nchar(MAX)')
    })

    it('debería formatear binary y varbinary', () => {
      expect(formatSQLDataType('binary', 16, 0, 0)).toBe('binary(16)')
      expect(formatSQLDataType('varbinary', -1, 0, 0)).toBe('varbinary(MAX)')
    })
  })

  describe('tipos numéricos', () => {
    it('debería formatear numeric y decimal con precisión y escala', () => {
      expect(formatSQLDataType('numeric', 0, 18, 2)).toBe('numeric(18, 2)')
      expect(formatSQLDataType('decimal', 0, 10, 3)).toBe('decimal(10, 3)')
    })

    it('debería formatear float solo con su precisión', () => {
      // SQL Server define float(n), con n entre 1 y 53. No admite escala.
      expect(formatSQLDataType('float', 0, 53, 0)).toBe('float(53)')
      expect(formatSQLDataType('float', 0, 24, 0)).toBe('float(24)')
    })
  })

  describe('otros tipos', () => {
    it('debería devolver el tipo en minúsculas sin parámetros', () => {
      expect(formatSQLDataType('datetime', 0, 0, 0)).toBe('datetime')
      expect(formatSQLDataType('uniqueidentifier', 0, 0, 0)).toBe('uniqueidentifier')
    })

    it('debería aceptar el tipo en mayúsculas o mixto', () => {
      expect(formatSQLDataType('VARCHAR', 50, 0, 0)).toBe('varchar(50)')
      expect(formatSQLDataType('NVarChar', 100, 0, 0)).toBe('nvarchar(50)')
    })
  })
})
