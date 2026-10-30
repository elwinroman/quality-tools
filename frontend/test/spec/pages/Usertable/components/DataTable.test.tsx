import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Columns, schemaSortOptions } from '@/pages/Usertable/components/Columns'
import { DataTable, useSchemaTable } from '@/pages/Usertable/components/DataTable'
import { TableControls } from '@/pages/Usertable/components/TableControls'
import { useUserTableStore } from '@/pages/Usertable/store/usertable.store'

function setStoreState() {
  useUserTableStore.setState({
    userTableColumnList: [
      { id: 1, name: 'ClienteId', type: 'int', isNullable: false, isIdentity: true, defaultDefinition: null, extendedProperties: [] },
      { id: 2, name: 'apellido', type: 'varchar', isNullable: true, isIdentity: false, defaultDefinition: null, extendedProperties: [] },
      {
        id: 3,
        name: 'ClienteNombre',
        type: 'nvarchar',
        isNullable: false,
        isIdentity: false,
        defaultDefinition: null,
        extendedProperties: [],
      },
    ],
    userTableIndexList: [],
    userTableForeignKeyList: [],
  })
}

function renderDataTable() {
  function TestTable() {
    const table = useSchemaTable({ columns: Columns })

    return (
      <>
        <TableControls
          count={3}
          countLabel="columnas"
          filterColumnId="nombre"
          searchLabel="Buscar columna"
          sortButtonLabel="Ordenar columnas"
          sortOptions={schemaSortOptions}
          table={table}
        />
        <DataTable columns={Columns} table={table} />
      </>
    )
  }

  render(<TestTable />)
}

function columnNames() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[1]?.textContent)
}

describe('DataTable', () => {
  it('filtra por una parte del nombre de columna sin distinguir mayusculas', async () => {
    setStoreState()
    renderDataTable()

    await userEvent.type(screen.getByRole('textbox', { name: 'Buscar columna' }), 'cLiEnTe')

    expect(screen.getByText('ClienteId')).toBeInTheDocument()
    expect(screen.getByText('ClienteNombre')).toBeInTheDocument()
    expect(screen.queryByText('apellido')).not.toBeInTheDocument()
  })

  it('ordena las columnas desde el dropdown', async () => {
    setStoreState()
    renderDataTable()

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar columnas' }))
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Nombre (A-Z)' }))

    expect(columnNames()).toEqual(['apellido', 'ClienteId', 'ClienteNombre'])
    expect(screen.getByRole('button', { name: 'Ordenar columnas' })).toHaveTextContent('Nombre (A-Z)')

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar columnas' }))
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Nombre (Z-A)' }))

    expect(columnNames()).toEqual(['ClienteNombre', 'ClienteId', 'apellido'])
  })

  it('no expone controles de orden en los encabezados', () => {
    setStoreState()
    renderDataTable()

    for (const name of ['Nro', 'Nombre columna', 'Tipo']) {
      expect(within(screen.getByRole('columnheader', { name })).queryByRole('button')).not.toBeInTheDocument()
    }
  })
})
