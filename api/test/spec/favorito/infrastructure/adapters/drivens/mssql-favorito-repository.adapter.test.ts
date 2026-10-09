import { MSSQLExecutor, MSSQLTransactionContext, MSSQLTransactionRunner } from '@core/store/mssql-query-runner'
import { FavoriteScopeContext, FavoritoFilterRepo, FavoritoRepoInput } from '@favorito/domain/schemas/favorito'
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

const CONTEXT: FavoriteScopeContext = {
  serverName: 'SRV_PROD',
  databaseName: 'RRHH',
}

const SCOPE_COLUMNS = {
  FavoriteScopeId: 1,
  ServerName: 'SRV_PROD',
  DatabaseName: 'RRHH',
}

function buildRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idFavorito: 1,
    cSchema: 'dbo',
    cNombreObjeto: 'vw_orders',
    cType: 'V',
    dFecha: new Date('2026-01-01T00:00:00.000Z'),
    lVigente: true,
    nTotal: 1,
    ...SCOPE_COLUMNS,
    ...overrides,
  }
}

function buildFilter(overrides: Partial<FavoritoFilterRepo> = {}): FavoritoFilterRepo {
  return {
    idUser: 7,
    type: "'V'",
    context: CONTEXT,
    ...overrides,
  }
}

function buildRepoInput(overrides: Partial<FavoritoRepoInput> = {}): FavoritoRepoInput {
  return {
    idUser: 7,
    schema: 'dbo',
    objectName: 'vw_orders',
    type: 'V',
    date: new Date('2026-01-01T00:00:00.000Z'),
    isActive: true,
    scope: { serverName: 'SRV_PROD', databaseName: 'RRHH' },
    ...overrides,
  }
}

function buildAdapter() {
  const query = vi.fn()
  const executor = { query } as unknown as MSSQLExecutor
  // El runner en test ejecuta el callback contra el mismo mock de `query`, así que
  // createOrUpdate deja la sentencia observable igual que findMany/getById.
  const runInTransaction = vi.fn(
    <T>(_credentials: unknown, _userType: unknown, operation: (context: MSSQLTransactionContext) => Promise<T>): Promise<T> =>
      operation({ query, execute: query, rollback: async () => undefined }),
  )
  const transactionRunner = { runInTransaction } as unknown as MSSQLTransactionRunner
  const adapter = new MSSQLFavoritoRepositoryAdapter(executor, transactionRunner)

  return { adapter, query, runInTransaction }
}

describe('MSSQLFavoritoRepositoryAdapter.createOrUpdate', () => {
  describe('atomicidad', () => {
    it('debería ejecutar el batch completo dentro de una transacción', async () => {
      const { adapter, query, runInTransaction } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow()] })

      await adapter.createOrUpdate(buildRepoInput())

      // El lock de rango de UPDLOCK/HOLDLOCK solo abarca todos los statements si
      // el find-or-create y el upsert comparten transacción.
      expect(runInTransaction).toHaveBeenCalledTimes(1)
    })
  })

  describe('alcance global', () => {
    it('debería usar el id reservado 0 sin tocar dbo.FavoriteScope', async () => {
      const { adapter, query } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow({ FavoriteScopeId: 0, ServerName: null, DatabaseName: null })] })

      await adapter.createOrUpdate(buildRepoInput({ scope: { serverName: null, databaseName: null } }))

      const [command] = query.mock.calls[0]
      expect(command.statement).toContain('SET @scopeId = 0')
      expect(command.statement).toContain('FavoriteScopeId = @scopeId')
      expect(command.statement).toContain(
        'INSERT INTO dbo.Favorito (idUsuario, FavoriteScopeId, cSchema, cNombreObjeto, cType, dFecha, lVigente)',
      )
      expect(command.parameters).toEqual([
        { name: 'idUser', type: sql.Int, value: 7 },
        { name: 'schema', type: sql.VarChar(64), value: 'dbo' },
        { name: 'objectName', type: sql.VarChar(128), value: 'vw_orders' },
        { name: 'type', type: sql.Char(2), value: 'V' },
        { name: 'date', type: sql.DateTime, value: new Date('2026-01-01T00:00:00.000Z') },
        { name: 'isActive', type: sql.Bit, value: true },
        { name: 'serverName', type: sql.VarChar(64), value: null },
        { name: 'databaseName', type: sql.VarChar(64), value: null },
      ])
    })
  })

  describe('alcance por base (find-or-create)', () => {
    it('debería hacer find-or-create del alcance con locks y enlazar los nombres', async () => {
      const { adapter, query } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow()] })

      await adapter.createOrUpdate(buildRepoInput())

      const [command] = query.mock.calls[0]
      expect(command.statement).toContain('FROM dbo.FavoriteScope WITH (UPDLOCK, HOLDLOCK)')
      expect(command.statement).toContain('INSERT INTO dbo.FavoriteScope (ServerName, DatabaseName)')
      expect(command.statement).toContain('SET @scopeId = SCOPE_IDENTITY()')
      // Predicados NULL-safe que matchean el alcance exacto.
      expect(command.statement).toContain('(ServerName   = @serverName   OR (ServerName   IS NULL AND @serverName   IS NULL))')
      expect(command.statement).toContain('(DatabaseName = @databaseName OR (DatabaseName IS NULL AND @databaseName IS NULL))')
      expect(command.parameters).toEqual([
        { name: 'idUser', type: sql.Int, value: 7 },
        { name: 'schema', type: sql.VarChar(64), value: 'dbo' },
        { name: 'objectName', type: sql.VarChar(128), value: 'vw_orders' },
        { name: 'type', type: sql.Char(2), value: 'V' },
        { name: 'date', type: sql.DateTime, value: new Date('2026-01-01T00:00:00.000Z') },
        { name: 'isActive', type: sql.Bit, value: true },
        { name: 'serverName', type: sql.VarChar(64), value: 'SRV_PROD' },
        { name: 'databaseName', type: sql.VarChar(64), value: 'RRHH' },
      ])
    })

    it('debería devolver el favorito con su alcance desde el JOIN del SELECT', async () => {
      const { adapter, query } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow({ idFavorito: 55 })] })

      const result = await adapter.createOrUpdate(buildRepoInput())

      expect(result).toEqual({
        data: {
          id: 55,
          schema: 'dbo',
          objectName: 'vw_orders',
          type: 'V',
          date: new Date('2026-01-01T00:00:00.000Z'),
          isActive: true,
          scope: { serverName: 'SRV_PROD', databaseName: 'RRHH' },
        },
      })
    })
  })
})

describe('MSSQLFavoritoRepositoryAdapter.findMany', () => {
  describe('parametrización del filtro de tipos', () => {
    it('debería enviar placeholders generados y ningún código crudo en el SQL', async () => {
      const { adapter, query } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow()] })

      await adapter.findMany(buildFilter({ type: "'P', 'FN'" }), 10)

      const [command] = query.mock.calls[0]
      expect(command.statement).toContain('cType     IN (@type0, @type1)')
      expect(command.statement).not.toContain("'P'")
      expect(command.statement).not.toContain("'FN'")
      expect(command.statement).not.toContain("'P', 'FN'")
    })

    it('debería enlazar cada valor como parámetro CHAR(2)', async () => {
      const { adapter, query } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow()] })

      await adapter.findMany(buildFilter({ type: "'P', 'FN'" }), 10)

      const [command] = query.mock.calls[0]
      expect(command.parameters).toEqual([
        { name: 'idUser', type: sql.Int, value: 7 },
        { name: 'limit', type: sql.Int, value: 10 },
        { name: 'serverName', type: sql.VarChar(64), value: 'SRV_PROD' },
        { name: 'databaseName', type: sql.VarChar(64), value: 'RRHH' },
        { name: 'type0', type: sql.Char(2), value: 'P' },
        { name: 'type1', type: sql.Char(2), value: 'FN' },
      ])
    })
  })

  describe('filtro de alcance', () => {
    it('debería unir dbo.FavoriteScope y aceptar global + servidor/base actuales', async () => {
      const { adapter, query } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow()] })

      await adapter.findMany(buildFilter(), 10)

      const [command] = query.mock.calls[0]
      // Global aplica en cualquier contexto; el favorito de BD aplica solo en su (servidor, base).
      expect(command.statement).toContain('INNER JOIN dbo.FavoriteScope s ON s.FavoriteScopeId = f.FavoriteScopeId')
      expect(command.statement).toContain('(s.ServerName IS NULL AND s.DatabaseName IS NULL)')
      expect(command.statement).toContain('(s.ServerName = @serverName AND (s.DatabaseName IS NULL OR s.DatabaseName = @databaseName))')
    })

    it('debería enlazar el contexto del filtro como parámetros', async () => {
      const { adapter, query } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow()] })

      await adapter.findMany(buildFilter({ context: { serverName: 'SRV_PRE', databaseName: 'VENTAS' } }), 10)

      const [command] = query.mock.calls[0]
      expect(command.parameters).toContainEqual({ name: 'serverName', type: sql.VarChar(64), value: 'SRV_PRE' })
      expect(command.parameters).toContainEqual({ name: 'databaseName', type: sql.VarChar(64), value: 'VENTAS' })
    })
  })

  describe('lista de tipos vacía', () => {
    it('debería devolver un resultado vacío sin ejecutar la consulta', async () => {
      const { adapter, query } = buildAdapter()

      const result = await adapter.findMany(buildFilter({ type: '' }), 10)

      // `IN ()` es SQL inválido: en vez de fallar, la lista vacía no matchea ninguna fila.
      expect(result).toEqual({ data: [], meta: { total: 0, limit: 10 } })
      expect(query).not.toHaveBeenCalled()
    })
  })

  describe('forma de la respuesta', () => {
    it('debería mapear las filas y conservar la meta', async () => {
      const { adapter, query } = buildAdapter()
      query.mockResolvedValue({ recordset: [buildRow({ idFavorito: 10, nTotal: 3 })] })

      const result = await adapter.findMany(buildFilter({ type: "'V'" }), 10)

      expect(result).toEqual({
        data: [
          {
            id: 10,
            schema: 'dbo',
            objectName: 'vw_orders',
            type: 'V',
            date: new Date('2026-01-01T00:00:00.000Z'),
            isActive: true,
            scope: { serverName: 'SRV_PROD', databaseName: 'RRHH' },
          },
        ],
        meta: { total: 3, limit: 10 },
      })
    })
  })
})
