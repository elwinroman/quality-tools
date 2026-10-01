import { MSSQLExecutor } from '@core/store/mssql-query-runner'
import { MSSQLFavoritoRepositoryAdapter } from '@favorito/infrastructure/adapters/drivens/mssql-favorito-repository.adapter'
import sql from 'mssql'
import { describe, expect, it, vi } from 'vitest'

// El adaptador resuelve credenciales estáticas al construirse; se aísla del entorno
// de ejecución para no depender de la desencriptación del `.env`.
vi.mock('@core/store', () => ({
  DatabaseName: { APP: 'APP' },
  getStaticDatabaseCredentials: () => ({
    credentials: { host: 'host', database: 'database', user: 'user', password: 'password' },
    type: 'Internal',
  }),
}))

function buildRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idFavorito: 1,
    cSchema: 'dbo',
    cNombreObjeto: 'vw_orders',
    cType: 'V',
    dFecha: new Date('2026-01-01T00:00:00.000Z'),
    lVigente: true,
    nTotal: 1,
    ...overrides,
  }
}

function buildAdapter() {
  const query = vi.fn()
  const executor = { query } as unknown as MSSQLExecutor
  const adapter = new MSSQLFavoritoRepositoryAdapter(executor)

  return { adapter, query }
}

describe('MSSQLFavoritoRepositoryAdapter.findMany', () => {
  describe('parametrización del filtro de tipos', () => {
    it('debería enviar placeholders generados y ningún código crudo en el SQL', async () => {
      const { adapter, query } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow()] })

      await adapter.findMany({ idUser: 7, type: "'P', 'FN'" }, 10)

      const [command] = query.mock.calls[0]
      expect(command.statement).toContain('cType     IN (@type0, @type1)')
      expect(command.statement).not.toContain("'P'")
      expect(command.statement).not.toContain("'FN'")
      expect(command.statement).not.toContain("'P', 'FN'")
    })

    it('debería enlazar cada valor como parámetro CHAR(2)', async () => {
      const { adapter, query } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow()] })

      await adapter.findMany({ idUser: 7, type: "'P', 'FN'" }, 10)

      const [command] = query.mock.calls[0]
      expect(command.parameters).toEqual([
        { name: 'idUser', type: sql.Int, value: 7 },
        { name: 'limit', type: sql.Int, value: 10 },
        { name: 'type0', type: sql.Char(2), value: 'P' },
        { name: 'type1', type: sql.Char(2), value: 'FN' },
      ])
    })
  })

  describe('lista de tipos vacía', () => {
    it('debería devolver un resultado vacío sin ejecutar la consulta', async () => {
      const { adapter, query } = buildAdapter()

      const result = await adapter.findMany({ idUser: 7, type: '' }, 10)

      // `IN ()` es SQL inválido: en vez de fallar, la lista vacía no matchea ninguna fila.
      expect(result).toEqual({ data: [], meta: { total: 0, limit: 10 } })
      expect(query).not.toHaveBeenCalled()
    })
  })

  describe('forma de la respuesta', () => {
    it('debería mapear las filas y conservar la meta', async () => {
      const { adapter, query } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow({ idFavorito: 10, nTotal: 3 })] })

      const result = await adapter.findMany({ idUser: 7, type: "'V'" }, 10)

      expect(result).toEqual({
        data: [
          {
            id: 10,
            schema: 'dbo',
            objectName: 'vw_orders',
            type: 'V',
            date: new Date('2026-01-01T00:00:00.000Z'),
            isActive: true,
          },
        ],
        meta: { total: 3, limit: 10 },
      })
    })
  })
})
