import { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { MSSQLConnection } from '@core/store/mssql-connection'
import { UserTypeEnum } from '@core/store/mssql-database-connection'
import { MSSQLQueryRunner } from '@core/store/mssql-query-runner'
import { MssqlSysUsertableRepositoryAdapter } from '@sysobject/infrastructure/adapters/drivens/mssql-sysusertable-repository.adapter'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'

const credentials = { host: 'host', database: 'database', user: 'user', password: 'password' }

// Doble del contrato inyectado: el adaptador solo necesita `connect().request().input().query()`
const connectionControl = {
  connect: vi.fn(),
  input: vi.fn(),
  query: vi.fn(),
}

const connection: MSSQLConnection = { connect: connectionControl.connect }
const queryRunner = new MSSQLQueryRunner(connection)

function buildResolver(): CurrentStoreContextResolver {
  return {
    resolve: vi.fn(async () => ({
      authContext: { userId: 1, sessionId: 'session' },
      store: { credentials, type: UserTypeEnum.External },
    })),
  }
}

function buildColumnRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    column_id: 1,
    name: 'id',
    type_name: 'varchar',
    max_length: 50,
    precision: 0,
    scale: 0,
    is_nullable: false,
    is_identity: true,
    default_definition: null,
    ...overrides,
  }
}

function buildExtendedPropertyRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { column_id: 1, value: 'descripcion', name: 'MS_Description', ...overrides }
}

function buildIndexRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    index_name: 'PK_Clientes',
    type_desc: 'CLUSTERED',
    is_primary_key: true,
    is_unique: true,
    is_filtered: false,
    filter_definition: null,
    column_id: 1,
    column_name: 'id',
    key_ordinal: 1,
    is_descending_key: false,
    is_included_column: false,
    is_disabled: false,
    ...overrides,
  }
}

describe('MssqlSysUsertableRepositoryAdapter.getColumnsById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    connectionControl.connect.mockResolvedValue({
      request: () => ({ input: connectionControl.input, query: connectionControl.query }),
    })
    connectionControl.input.mockReturnValue({ query: connectionControl.query })
    connectionControl.query.mockResolvedValue({ recordset: [] })
  })

  it('debería asociar cada propiedad extendida a su columna aunque el segundo recordset llegue en otro orden', async () => {
    connectionControl.query.mockResolvedValue({
      recordsets: [
        [buildColumnRow({ column_id: 1, name: 'id' }), buildColumnRow({ column_id: 2, name: 'nombre' })],
        // llegan al revés que las columnas: la asociación no puede depender del índice de fila
        [
          buildExtendedPropertyRow({ column_id: 2, value: 'descripcion del nombre' }),
          buildExtendedPropertyRow({ column_id: 1, value: 'descripcion del id' }),
        ],
      ],
    })

    const adapter = new MssqlSysUsertableRepositoryAdapter(queryRunner, buildResolver())
    const columns = await adapter.getColumnsById(10)

    const columnById = new Map(columns.map(column => [column.id, column]))
    expect(columnById.get(1)?.extendedProperties).toEqual([{ propertyValue: 'descripcion del id', propertyName: 'MS_Description' }])
    expect(columnById.get(2)?.extendedProperties).toEqual([{ propertyValue: 'descripcion del nombre', propertyName: 'MS_Description' }])
  })

  it('debería dejar sin propiedades a las columnas que no aparecen en el segundo recordset', async () => {
    connectionControl.query.mockResolvedValue({
      recordsets: [
        [buildColumnRow({ column_id: 1, name: 'id' }), buildColumnRow({ column_id: 2, name: 'nombre' })],
        [buildExtendedPropertyRow({ column_id: 2, value: 'solo la segunda tiene descripcion' })],
      ],
    })

    const adapter = new MssqlSysUsertableRepositoryAdapter(queryRunner, buildResolver())
    const columns = await adapter.getColumnsById(10)

    const columnById = new Map(columns.map(column => [column.id, column]))
    expect(columnById.get(1)?.extendedProperties).toEqual([])
    expect(columnById.get(2)?.extendedProperties).toEqual([
      { propertyValue: 'solo la segunda tiene descripcion', propertyName: 'MS_Description' },
    ])
  })

  it('debería descartar en silencio una propiedad extendida cuyo column_id no coincide con ninguna columna', async () => {
    connectionControl.query.mockResolvedValue({
      recordsets: [[buildColumnRow({ column_id: 1, name: 'id' })], [buildExtendedPropertyRow({ column_id: 99, value: 'huerfana' })]],
    })

    const adapter = new MssqlSysUsertableRepositoryAdapter(queryRunner, buildResolver())
    const columns = await adapter.getColumnsById(10)

    // comportamiento actual: la propiedad huérfana no se adjunta a ninguna columna ni lanza
    expect(columns).toHaveLength(1)
    const [column] = columns
    expect(column?.extendedProperties).toEqual([])
  })

  it('debería devolver columnas con propiedades vacías cuando el batch no trae el segundo recordset', async () => {
    connectionControl.query.mockResolvedValue({
      recordsets: [[buildColumnRow({ column_id: 1, name: 'id' })]],
    })

    const adapter = new MssqlSysUsertableRepositoryAdapter(queryRunner, buildResolver())
    const columns = await adapter.getColumnsById(10)

    const [column] = columns
    expect(column?.extendedProperties).toEqual([])
  })
})

describe('MssqlSysUsertableRepositoryAdapter.getIndexesById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    connectionControl.connect.mockResolvedValue({
      request: () => ({ input: connectionControl.input, query: connectionControl.query }),
    })
    connectionControl.input.mockReturnValue({ query: connectionControl.query })
    connectionControl.query.mockResolvedValue({ recordset: [] })
  })

  it('debería agrupar las filas de un mismo índice en uno solo con todas sus columnas en orden de llegada', async () => {
    connectionControl.query.mockResolvedValue({
      recordset: [
        buildIndexRow({
          index_name: 'IX_Clientes_Apellido_Nombre',
          type_desc: 'NONCLUSTERED',
          column_id: 2,
          column_name: 'apellido',
          key_ordinal: 1,
        }),
        buildIndexRow({
          index_name: 'IX_Clientes_Apellido_Nombre',
          type_desc: 'NONCLUSTERED',
          column_id: 3,
          column_name: 'nombre',
          key_ordinal: 2,
        }),
        // la consulta ya ordena por key_ordinal; el adapter concatena sin reordenar
        buildIndexRow({
          index_name: 'IX_Clientes_Apellido_Nombre',
          type_desc: 'NONCLUSTERED',
          column_id: 4,
          column_name: 'fecha_alta',
          key_ordinal: 0,
          is_included_column: true,
        }),
      ],
    })

    const adapter = new MssqlSysUsertableRepositoryAdapter(queryRunner, buildResolver())
    const indexes = await adapter.getIndexesById(10)

    expect(indexes).toHaveLength(1)
    const [index] = indexes
    expect(index?.name).toBe('IX_Clientes_Apellido_Nombre')
    expect(index?.columns).toEqual([
      { columnId: 2, columnName: 'apellido', keyOrdinal: 1, isDescendingKey: false, isIncludedColumn: false },
      { columnId: 3, columnName: 'nombre', keyOrdinal: 2, isDescendingKey: false, isIncludedColumn: false },
      { columnId: 4, columnName: 'fecha_alta', keyOrdinal: 0, isDescendingKey: false, isIncludedColumn: true },
    ])
  })

  it('debería propagar crudo un error Zod ocurrido después de ejecutar la query', async () => {
    connectionControl.query.mockResolvedValue({ recordset: [buildIndexRow({ is_primary_key: 'inválido' })] })
    const adapter = new MssqlSysUsertableRepositoryAdapter(queryRunner, buildResolver())

    const operation = adapter.getIndexesById(10)

    await expect(operation).rejects.toBeInstanceOf(ZodError)
  })
})

describe('MssqlSysUsertableRepositoryAdapter.getForeignKeysById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    connectionControl.connect.mockResolvedValue({
      request: () => ({ input: connectionControl.input, query: connectionControl.query }),
    })
    connectionControl.input.mockReturnValue({ query: connectionControl.query })
    connectionControl.query.mockResolvedValue({ recordset: [] })
  })

  it('debería parametrizar el id como @id y enlazarlo como entrada declarativa', async () => {
    connectionControl.query.mockResolvedValue({ recordset: [] })

    const adapter = new MssqlSysUsertableRepositoryAdapter(queryRunner, buildResolver())
    await adapter.getForeignKeysById(10)

    const [stmt] = connectionControl.query.mock.calls[0]
    expect(stmt).toContain('WHERE A.object_id = @id')
    expect(stmt).not.toContain('${id}')
    expect(stmt).not.toContain('A.object_id = 10')
    expect(connectionControl.input).toHaveBeenCalledWith('id', expect.anything(), 10)
  })
})

describe('MssqlSysUsertableRepositoryAdapter resolución y conexión', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    connectionControl.connect.mockResolvedValue({
      request: () => ({ input: connectionControl.input, query: connectionControl.query }),
    })
    connectionControl.input.mockReturnValue({ query: connectionControl.query })
    connectionControl.query.mockResolvedValue({ recordset: [] })
  })

  it('debería resolver el contexto y usar sus credenciales antes de abrir la conexión', async () => {
    connectionControl.query.mockResolvedValue({ recordsets: [[], []] })

    const resolver = buildResolver()
    const adapter = new MssqlSysUsertableRepositoryAdapter(queryRunner, resolver)

    await adapter.getColumnsById(10)

    expect(resolver.resolve).toHaveBeenCalledTimes(1)
    expect(connectionControl.connect).toHaveBeenCalledWith(credentials, UserTypeEnum.External)

    const resolveOrder = vi.mocked(resolver.resolve).mock.invocationCallOrder[0]
    const connectOrder = connectionControl.connect.mock.invocationCallOrder[0]
    expect(resolveOrder).toBeLessThan(connectOrder)
  })

  it('debería propagar el error del resolver sin intentar conectar', async () => {
    const failure = new Error('sin sesión')
    const resolver: CurrentStoreContextResolver = { resolve: vi.fn(async () => Promise.reject(failure)) }

    const adapter = new MssqlSysUsertableRepositoryAdapter(queryRunner, resolver)

    await expect(adapter.getColumnsById(10)).rejects.toBe(failure)
    expect(connectionControl.connect).not.toHaveBeenCalled()
  })

  it('debería propagar crudo el fallo de conexión en vez de tragárselo', async () => {
    const failure = new Error('conexión rechazada')
    connectionControl.connect.mockRejectedValue(failure)

    const adapter = new MssqlSysUsertableRepositoryAdapter(queryRunner, buildResolver())

    await expect(adapter.getColumnsById(10)).rejects.toBe(failure)
  })
})
