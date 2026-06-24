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
import { cn } from '@/lib/utils'

import { useUserTableStore } from '../store/usertable.store'
import type { IndexRow } from './IndexColumns'

interface Props {
  columns: ColumnDef<IndexRow>[]
}

export function IndexDataTable({ columns }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])

  const indexes = useUserTableStore((state) => state.userTableIndexList)

  const formattedData: IndexRow[] = useMemo(() => {
    return indexes.map((index) => ({
      name: index.name,
      typeDesc: index.typeDesc,
      isPrimaryKey: index.isPrimaryKey,
      isUnique: index.isUnique,
      isFiltered: index.isFiltered,
      filterDefinition: index.filterDefinition,
      isDisabled: index.isDisabled,
      columns: index.columns,
    }))
  }, [indexes])

  const table = useReactTable({
    data: formattedData,
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
    <div className="border-y">
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
              <TableRow
                key={row.id}
                className={cn(row.original.isDisabled && 'opacity-55 hover:opacity-75')}
                data-disabled={row.original.isDisabled || undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Sin índices.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
