import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { useUserTableStore } from '../store/usertable.store'

interface Props<TData> {
  columns: ColumnDef<TData>[]
}

export function DataTable<TData>({ columns }: Props<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columnList = useUserTableStore((state) => state.userTableColumnList)
  const indexes = useUserTableStore((state) => state.userTableIndexList)
  const foreignKeys = useUserTableStore((state) => state.userTableForeignKeyList)

  const formattedData = useMemo(() => {
    return columnList.map((item, index) => {
      const foreignKey = foreignKeys.filter((element) => element.columnId === item.id)

      return {
        nro: index + 1,
        nombre: {
          desc: item.name,
          renderPrimaryKeyIcon: indexes.find((element) => element.columns.some((col) => col.columnId === item.id))?.isPrimaryKey ?? false,
          renderUniqueKeyIcon: indexes.find((element) => element.columns.some((col) => col.columnId === item.id))?.isUnique ?? false,
        },
        tipo: item.type,
        nulo: item.isNullable,
        atributo: item.isIdentity ? 'IDENTITY' : item.defaultDefinition ? `DEFAULT: ${item.defaultDefinition.slice(1, -1)}` : '',
        referencia: [...foreignKey],
        descripcion: item.extendedProperties.map((element) => element.propertyValue),
      }
    })
  }, [columnList, foreignKeys, indexes])

  const table = useReactTable({
    data: formattedData as TData[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div className="border-b">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: `${header.getSize()}px` }}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Sin resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
