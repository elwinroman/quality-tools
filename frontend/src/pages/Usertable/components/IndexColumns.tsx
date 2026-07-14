import { type ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowDownAZ, ArrowDownUp, ArrowDownZA, ArrowUp, Check, Filter } from 'lucide-react'

import { Key } from '@/icons'

import type { UserTableIndexColumn } from '../models/usertable.model'

interface IndexRow {
  name: string
  typeDesc: string
  isPrimaryKey: boolean
  isUnique: boolean
  isFiltered: boolean
  filterDefinition: string | null
  isDisabled: boolean
  columns: UserTableIndexColumn[]
}

export type { IndexRow }

function ColumnChips({ columns }: { columns: UserTableIndexColumn[] }) {
  const keyColumns = columns.filter((c) => !c.isIncludedColumn).sort((a, b) => a.keyOrdinal - b.keyOrdinal)
  const includedColumns = columns.filter((c) => c.isIncludedColumn)

  return (
    <div className="flex flex-wrap items-center gap-1">
      {keyColumns.map((col) => (
        <span key={col.columnId} className="bg-background-neutral text-primary flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs">
          {col.isDescendingKey ? (
            <ArrowDown size={10} className="text-secondary shrink-0" />
          ) : (
            <ArrowUp size={10} className="text-secondary shrink-0" />
          )}
          {col.columnName}
        </span>
      ))}

      {includedColumns.length > 0 && (
        <>
          <span className="text-muted px-0.5 text-xs">INCLUDE</span>
          {includedColumns.map((col) => (
            <span key={col.columnId} className="bg-background-neutral text-muted rounded-sm px-1.5 py-0.5 text-xs">
              {col.columnName}
            </span>
          ))}
        </>
      )}
    </div>
  )
}

export const IndexColumns: ColumnDef<IndexRow>[] = [
  {
    accessorKey: 'name',
    size: 250,
    enableSorting: true,
    header: ({ column }) => (
      <button className="flex w-full items-center gap-2" onClick={column.getToggleSortingHandler()}>
        <span>Nombre índice</span>
        {{
          asc: <ArrowDownAZ size={14} className="text-secondary" />,
          desc: <ArrowDownZA size={14} className="text-secondary" />,
        }[column.getIsSorted() as string] ?? <ArrowDownUp size={14} className="text-muted" />}
      </button>
    ),
    cell: ({ row }) => <span className="text-primary font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'typeDesc',
    size: 160,
    enableSorting: true,
    header: ({ column }) => (
      <button className="flex w-full items-center gap-2" onClick={column.getToggleSortingHandler()}>
        <span>Tipo</span>
        {{
          asc: <ArrowDownAZ size={14} className="text-secondary" />,
          desc: <ArrowDownZA size={14} className="text-secondary" />,
        }[column.getIsSorted() as string] ?? <ArrowDownUp size={14} className="text-muted" />}
      </button>
    ),
    cell: ({ row }) => (
      <span className="bg-background-neutral text-secondary w-fit rounded-sm px-1 py-0.5 text-center text-xs font-semibold whitespace-nowrap">
        {row.original.typeDesc}
      </span>
    ),
  },
  {
    accessorKey: 'columns',
    size: 420,
    header: 'Columnas',
    cell: ({ row }) => <ColumnChips columns={row.original.columns} />,
  },
  {
    accessorKey: 'isPrimaryKey',
    size: 80,
    header: 'PK',
    cell: ({ row }) => <>{row.original.isPrimaryKey && <Key size={14} className="text-amber-400" />}</>,
  },
  {
    accessorKey: 'isUnique',
    size: 80,
    header: 'Unique',
    cell: ({ row }) => <>{row.original.isUnique && <Check size={16} strokeWidth={3} className="text-emerald-500" />}</>,
  },
  {
    accessorKey: 'isDisabled',
    size: 130,
    enableSorting: true,
    header: 'Estado',
    cell: ({ row }) =>
      row.original.isDisabled ? (
        <span className="border-border text-muted inline-flex w-fit items-center rounded-sm border px-1.5 py-0.5 text-xs font-medium">
          Deshabilitado
        </span>
      ) : null,
  },
  {
    accessorKey: 'filterDefinition',
    size: 280,
    header: 'Filtro',
    cell: ({ row }) =>
      row.original.isFiltered ? (
        <span className="flex items-center gap-1.5">
          <Filter size={12} className="text-secondary shrink-0" />
          <code className="text-primary font-mono text-xs">{row.original.filterDefinition}</code>
        </span>
      ) : null,
  },
]
