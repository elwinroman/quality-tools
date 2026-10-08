import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { Check, MessageCircleWarning } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Key } from '@/icons'

import type { UserTableForeignKey } from '../models/usertable.model'

interface ColumnRow {
  nro: number
  nombre: { desc: string; renderPrimaryKeyIcon: boolean; renderUniqueKeyIcon: boolean }
  tipo: string
  nulo: boolean
  atributo: string
  referencia: UserTableForeignKey[]
  descripcion: string[]
}

/** Opciones del dropdown de orden del tab Esquema */
export const schemaSortOptions: { value: string; label: string; sorting: SortingState }[] = [
  { value: 'original', label: 'Orden original', sorting: [] },
  { value: 'name-asc', label: 'Nombre (A-Z)', sorting: [{ id: 'nombre', desc: false }] },
  { value: 'name-desc', label: 'Nombre (Z-A)', sorting: [{ id: 'nombre', desc: true }] },
  { value: 'type-asc', label: 'Tipo (A-Z)', sorting: [{ id: 'tipo', desc: false }] },
  { value: 'type-desc', label: 'Tipo (Z-A)', sorting: [{ id: 'tipo', desc: true }] },
]

export const Columns: ColumnDef<ColumnRow>[] = [
  {
    accessorKey: 'nro',
    enableResizing: false,
    size: 20,
    header: 'Nro',
  },
  {
    id: 'nombre',
    accessorFn: (row) => row.nombre.desc,
    size: 300,
    sortingFn: (rowA, rowB, columnId) => {
      const a = (rowA.getValue(columnId) as string).toLowerCase()
      const b = (rowB.getValue(columnId) as string).toLowerCase()
      return a.localeCompare(b)
    },
    filterFn: (row, columnId, filterValue) => {
      const columnName = row.getValue(columnId) as string
      return columnName.toLowerCase().includes(String(filterValue).toLowerCase())
    },
    header: 'Nombre columna',
    cell: ({ row }) => {
      const { desc, renderPrimaryKeyIcon, renderUniqueKeyIcon } = row.original.nombre
      return (
        <div className="flex items-center gap-2">
          <span className="text-primary">{desc}</span>

          {renderPrimaryKeyIcon && (
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Key size={14} className="text-amber-700 dark:text-amber-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-amber-700 dark:text-amber-400">primary key</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {!renderPrimaryKeyIcon && renderUniqueKeyIcon && (
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Key size={14} className="text-blue-700 dark:text-blue-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-blue-700 dark:text-blue-400">unique key</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'tipo',
    size: 50,
    header: 'Tipo',
    cell: ({ row }) => {
      return (
        <span className="bg-background-neutral text-secondary w-fit rounded-sm px-1 py-0.5 text-center text-xs font-semibold whitespace-nowrap">
          {row.original.tipo}
        </span>
      )
    },
  },
  {
    accessorKey: 'nulo',
    header: 'Nulo',
    size: 20,
    cell: ({ row }) => {
      return <>{row.original.nulo && <Check size={16} strokeWidth={3} className="text-emerald-700 dark:text-emerald-500" />}</>
    },
  },
  {
    accessorKey: 'atributo',
    header: 'Atributos',
    size: 150,
    cell: ({ row }) => {
      return <span className="text-secondary">{row.original.atributo}</span>
    },
  },
  {
    accessorKey: 'referencia',
    header: 'Referencias',
    size: 300,
    cell: ({ row }) => {
      const { referencia } = row.original
      return (
        <div className="flex min-w-[100px] flex-col gap-2 text-blue-700 dark:text-blue-400">
          {referencia.map((item) => (
            <span key={`${item.columnId}-${item.referencedObject}`}>{`${item.referencedSchema}.${item.referencedObject}`}</span>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'descripcion',
    size: 700,
    enableResizing: false,
    header: () => {
      return <div className="min-w-[300px] text-left">Descripción</div>
    },
    cell: ({ row }) => {
      const { descripcion } = row.original
      return (
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-primary flex flex-col gap-2">
            {descripcion.length > 0 ? (
              descripcion.map((item, index) => <span key={index}>{item} </span>)
            ) : (
              <span className="text-muted">No existe descripción</span>
            )}
          </div>

          {descripcion.length > 1 && (
            <Popover>
              <PopoverTrigger>
                <i className="hover:bg-action-hover grid place-items-center rounded-sm p-1.5 text-red-700 transition-colors dark:text-red-400">
                  <MessageCircleWarning size={14} />
                </i>
              </PopoverTrigger>
              <PopoverContent>¡Existe más de una descripción para esta columna!</PopoverContent>
            </Popover>
          )}
        </div>
      )
    },
  },
]
