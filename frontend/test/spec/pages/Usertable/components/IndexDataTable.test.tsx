import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { IndexColumns, indexSortOptions } from '@/pages/Usertable/components/IndexColumns'
import { IndexDataTable, useIndexTable } from '@/pages/Usertable/components/IndexDataTable'
import { TableControls } from '@/pages/Usertable/components/TableControls'
import { useUserTableStore } from '@/pages/Usertable/store/usertable.store'

function setStoreState() {
  useUserTableStore.setState({
    userTableColumnList: [],
    userTableIndexList: [
      {
        name: 'idx_cliente',
        typeDesc: 'NONCLUSTERED',
        isPrimaryKey: false,
        isUnique: false,
        isFiltered: false,
        filterDefinition: null,
        isDisabled: false,
        columns: [{ columnId: 1, columnName: 'ClienteId', keyOrdinal: 1, isDescendingKey: false, isIncludedColumn: false }],
      },
      {
        name: 'PK_Cliente',
        typeDesc: 'CLUSTERED',
        isPrimaryKey: true,
        isUnique: true,
        isFiltered: false,
        filterDefinition: null,
        isDisabled: true,
        columns: [{ columnId: 1, columnName: 'ClienteId', keyOrdinal: 1, isDescendingKey: false, isIncludedColumn: false }],
      },
      {
        name: 'idx_apellido',
        typeDesc: 'NONCLUSTERED',
        isPrimaryKey: false,
        isUnique: false,
        isFiltered: true,
        filterDefinition: '[apellido] IS NOT NULL',
        isDisabled: false,
        columns: [{ columnId: 2, columnName: 'apellido', keyOrdinal: 1, isDescendingKey: true, isIncludedColumn: false }],
      },
    ],
    userTableForeignKeyList: [],
  })
}

function renderIndexTable() {
  function TestTable() {
    const table = useIndexTable({ columns: IndexColumns })

    return (
      <>
        <TableControls
          count={3}
          countLabel="índices"
          filterColumnId="name"
          searchLabel="Buscar índice"
          sortButtonLabel="Ordenar índices"
          sortOptions={indexSortOptions}
          table={table}
        />
        <IndexDataTable columns={IndexColumns} table={table} />
      </>
    )
  }

  render(<TestTable />)
}

function indexNames() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent)
}

describe('IndexDataTable', () => {
  it('filtra por una parte del nombre de índice sin distinguir mayusculas', async () => {
    setStoreState()
    renderIndexTable()

    await userEvent.type(screen.getByRole('textbox', { name: 'Buscar índice' }), 'cLiEnTe')

    expect(screen.getByText('idx_cliente')).toBeInTheDocument()
    expect(screen.getByText('PK_Cliente')).toBeInTheDocument()
    expect(screen.queryByText('idx_apellido')).not.toBeInTheDocument()
  })

  it('ordena los índices desde el dropdown', async () => {
    setStoreState()
    renderIndexTable()

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar índices' }))
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Nombre índice (A-Z)' }))

    expect(indexNames()).toEqual(['idx_apellido', 'idx_cliente', 'PK_Cliente'])
    expect(screen.getByRole('button', { name: 'Ordenar índices' })).toHaveTextContent('Nombre índice (A-Z)')

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar índices' }))
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Nombre índice (Z-A)' }))

    expect(indexNames()).toEqual(['PK_Cliente', 'idx_cliente', 'idx_apellido'])
    expect(screen.getByRole('button', { name: 'Ordenar índices' })).toHaveTextContent('Nombre índice (Z-A)')
  })

  it('no expone controles de orden en los encabezados', () => {
    setStoreState()
    renderIndexTable()

    for (const name of ['Nombre índice', 'Tipo']) {
      expect(within(screen.getByRole('columnheader', { name })).queryByRole('button')).not.toBeInTheDocument()
    }
  })
})
