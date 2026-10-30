import { normalizeSqlWhitespace, summarizeSqlSpanName } from '@observability/infrastructure/telemetry/sql-span-summary'
import { describe, expect, it } from 'vitest'

describe('normalizeSqlWhitespace', () => {
  it('debería colapsar y recortar espacios SQL', () => {
    expect(normalizeSqlWhitespace('  SELECT\n  *   FROM\t dbo.Users  ')).toBe('SELECT * FROM dbo.Users')
  })
})

describe('summarizeSqlSpanName', () => {
  it('debería resumir SELECT con JOIN al primer destino', () => {
    expect(summarizeSqlSpanName('SELECT p.name\nFROM sys.database_permissions AS p JOIN sys.objects o ON o.object_id = p.major_id')).toBe(
      'SELECT sys.database_permissions',
    )
  })

  it('debería resumir INSERT, UPDATE, DELETE, MERGE y EXEC', () => {
    expect(summarizeSqlSpanName('INSERT INTO dbo.users (id) VALUES (@id)')).toBe('INSERT dbo.users')
    expect(summarizeSqlSpanName('UPDATE dbo.users SET name = @name')).toBe('UPDATE dbo.users')
    expect(summarizeSqlSpanName('DELETE FROM dbo.users WHERE id = @id')).toBe('DELETE dbo.users')
    expect(summarizeSqlSpanName('MERGE INTO dbo.users AS target USING @rows AS source ON 1 = 1')).toBe('MERGE dbo.users')
    expect(summarizeSqlSpanName('EXEC dbo.GetUsers @id')).toBe('EXEC dbo.GetUsers')
  })

  it('debería usar el statement normalizado como fallback cuando no hay destino', () => {
    expect(summarizeSqlSpanName('SELECT 1')).toBe('SELECT 1')
    expect(summarizeSqlSpanName('WITH users AS (SELECT 1 AS id) SELECT id FROM users')).toBe(
      'WITH users AS (SELECT 1 AS id) SELECT id FROM users',
    )
  })

  it('debería ignorar comentarios iniciales y conservar el primer statement', () => {
    expect(summarizeSqlSpanName('-- consulta\nSELECT * FROM dbo.users; DELETE FROM dbo.other')).toBe('SELECT dbo.users')
    expect(summarizeSqlSpanName('/* nota */ EXEC dbo.GetUsers; SELECT 1')).toBe('EXEC dbo.GetUsers')
  })

  it('debería truncar a 80 caracteres y no lanzar con entradas extrañas', () => {
    expect(summarizeSqlSpanName(`SELECT ${'x'.repeat(100)}`)).toHaveLength(80)
    expect(() => summarizeSqlSpanName('/* comentario sin cerrar')).not.toThrow()
    expect(summarizeSqlSpanName('   ')).toBeNull()
    expect(summarizeSqlSpanName('/* comentario sin cerrar')).toBeNull()
  })
})
