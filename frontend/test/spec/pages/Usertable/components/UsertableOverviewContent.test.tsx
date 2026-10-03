import { format } from '@formkit/tempo'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { LOCAL_LANGUAJE } from '@/enviroment/enviroment'
import { UsertableOverviewContent } from '@/pages/Usertable/components/UsertableOverviewContent'
import { useUserTableStore } from '@/pages/Usertable/store/usertable.store'

/** Devuelve la tarjeta completa a partir del titulo de su encabezado. */
function statCard(title: string) {
  const header = screen.getByText(title).parentElement as HTMLElement
  return header.parentElement as HTMLElement
}

/** Devuelve la fila de encabezado de un bloque de relaciones a partir de su titulo. */
function relationHeader(title: string) {
  return screen.getByText(title).parentElement?.parentElement as HTMLElement
}

const baseObject = {
  id: 7,
  name: 'Clientes',
  type: 'U' as const,
  typeDesc: 'USERTABLE',
  schemaName: 'dbo',
  createDate: '25-03-2024',
  modifyDate: '26-03-2024',
}

/** Repite la conversion DD-MM-YYYY -> Date de la pagina para calcular la expectativa. */
function toDate(value: string): Date {
  const [day, month, year] = value.split('-')
  return new Date(`${year}-${month}-${day}`)
}

function setStoreState(overrides: Partial<ReturnType<typeof useUserTableStore.getState>> = {}) {
  useUserTableStore.setState({
    userTableObject: baseObject,
    userTableColumnList: [],
    userTableIndexList: [],
    userTableForeignKeyList: [],
    userTableExtendedPropertieList: [],
    dependencies: [],
    dependents: [],
    isLoadingRelations: false,
    errorRelations: null,
    ...overrides,
  })
}

/** Renderiza el Overview dentro del router (la navegacion por relacion lo requiere). */
function renderOverview() {
  render(
    <MemoryRouter>
      <UsertableOverviewContent />
    </MemoryRouter>,
  )
}

describe('UsertableOverviewContent', () => {
  it('muestra el titulo Overview y la metadata en tres filas sin el titulo Metadata', () => {
    setStoreState()

    renderOverview()

    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument()
    expect(screen.queryByText('Metadata')).not.toBeInTheDocument()

    expect(screen.getByText('Tipo')).toBeInTheDocument()
    expect(screen.getByText('Schema')).toBeInTheDocument()
    expect(screen.getByText('Object ID')).toBeInTheDocument()
    expect(screen.getByText('Creado')).toBeInTheDocument()
    expect(screen.getByText('Modificado')).toBeInTheDocument()

    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('USERTABLE (U)')).toBeInTheDocument()

    // El nombre del objeto solo existia en el bloque de identidad, que ya no se renderiza.
    expect(screen.queryByText('Clientes')).not.toBeInTheDocument()

    // La primera fila (Tipo) ocupa las dos columnas de la grilla.
    expect(screen.getByText('Tipo').parentElement).toHaveClass('sm:col-span-2')
  })

  it('muestra las fechas en formato corto dd/mm/yyyy y el formato largo en tooltip', async () => {
    setStoreState()

    renderOverview()

    const created = toDate(baseObject.createDate)
    const shortDate = format(created, 'DD/MM/YYYY', LOCAL_LANGUAJE)
    const fullDate = format(created, 'full', LOCAL_LANGUAJE)

    const trigger = screen.getByText(shortDate)
    expect(trigger).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await userEvent.hover(trigger)

    // Radix renderiza el contenido del tooltip con role="tooltip" al abrirlo.
    expect(await screen.findByRole('tooltip')).toHaveTextContent(fullDate)
  })

  it('deriva los conteos de las tres tarjetas del largo de las listas del store', () => {
    setStoreState({
      userTableColumnList: [
        { id: 1, name: 'Id', type: 'int', isNullable: false, isIdentity: true, defaultDefinition: null, extendedProperties: [] },
        { id: 2, name: 'Nombre', type: 'varchar', isNullable: true, isIdentity: false, defaultDefinition: null, extendedProperties: [] },
        { id: 3, name: 'Activo', type: 'bit', isNullable: false, isIdentity: false, defaultDefinition: '(1)', extendedProperties: [] },
      ],
      userTableIndexList: [
        {
          name: 'PK_Clientes',
          typeDesc: 'CLUSTERED',
          isPrimaryKey: true,
          isUnique: true,
          isFiltered: false,
          filterDefinition: null,
          isDisabled: false,
          columns: [],
        },
      ],
      userTableForeignKeyList: [
        { columnId: 10, referencedSchema: 'dbo', referencedObject: 'Paises' },
        { columnId: 11, referencedSchema: 'dbo', referencedObject: 'Ciudades' },
      ],
      userTableExtendedPropertieList: [{ propertyName: 'MS_Description', propertyValue: 'Tabla de clientes' }],
    })

    renderOverview()

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(statCard('Columnas')).toHaveTextContent('3')
    expect(statCard('Índices')).toHaveTextContent('1')
    expect(statCard('Foreign keys')).toHaveTextContent('2')
  })

  it('no renderiza las listas inventadas dentro de los cuadros y expande las propiedades extendidas', async () => {
    setStoreState({
      userTableColumnList: [
        { id: 2, name: 'Nombre', type: 'varchar', isNullable: true, isIdentity: false, defaultDefinition: null, extendedProperties: [] },
      ],
      userTableIndexList: [
        {
          name: 'PK_Clientes',
          typeDesc: 'CLUSTERED',
          isPrimaryKey: true,
          isUnique: true,
          isFiltered: false,
          filterDefinition: null,
          isDisabled: false,
          columns: [],
        },
      ],
      userTableForeignKeyList: [{ columnId: 10, referencedSchema: 'dbo', referencedObject: 'Paises' }],
      userTableExtendedPropertieList: [{ propertyName: 'MS_Description', propertyValue: 'Tabla de clientes' }],
    })

    renderOverview()

    expect(screen.queryByText('Nombre')).not.toBeInTheDocument()
    expect(screen.queryByText('PK_Clientes')).not.toBeInTheDocument()
    expect(screen.queryByText('dbo.Paises')).not.toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: /Propiedades extendidas/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('MS_Description')).toBeInTheDocument()
    expect(screen.getByText('Tabla de clientes')).toBeInTheDocument()
  })

  it('muestra el conteo en cero cuando las listas estan vacias', () => {
    setStoreState()

    renderOverview()

    expect(statCard('Columnas')).toHaveTextContent('0')
    expect(statCard('Índices')).toHaveTextContent('0')
    expect(statCard('Foreign keys')).toHaveTextContent('0')
    expect(screen.queryByText('Sin columnas.')).not.toBeInTheDocument()
  })

  it('mantiene Relaciones colapsado y carga las relaciones una sola vez al expandirlo', async () => {
    const fetchSpy = vi.fn()
    setStoreState({
      fetchUserTableRelations: fetchSpy,
      dependencies: [{ id: 1, name: 'TblBase', schemaName: 'dbo', typeDesc: 'USER_TABLE' }],
      dependents: [{ id: 2, name: 'VistaA', schemaName: 'dbo', typeDesc: 'VIEW' }],
    })

    renderOverview()

    const toggle = screen.getByRole('button', { name: /Relaciones/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Referencias')).not.toBeInTheDocument()
    expect(screen.queryByText('Dependencias')).not.toBeInTheDocument()
    expect(screen.queryByText('VistaA')).not.toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Objetos que utilizan este objeto.')).toBeInTheDocument()
    expect(screen.getByText('Objetos que este objeto utiliza.')).toBeInTheDocument()
    expect(relationHeader('Referencias')).toHaveTextContent('1')
    expect(relationHeader('Dependencias')).toHaveTextContent('1')
    expect(screen.getByText('VistaA')).toBeInTheDocument()
    expect(screen.getByText('TblBase')).toBeInTheDocument()

    // Cerrar y volver a abrir no vuelve a disparar la carga.
    await userEvent.click(toggle)
    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('muestra los mensajes de vacio de las relaciones cuando no hay datos', async () => {
    setStoreState({ fetchUserTableRelations: vi.fn() })

    renderOverview()

    await userEvent.click(screen.getByRole('button', { name: /Relaciones/ }))

    expect(screen.getByText('Sin referencias.')).toBeInTheDocument()
    expect(screen.getByText('Sin dependencias.')).toBeInTheDocument()
  })
})
