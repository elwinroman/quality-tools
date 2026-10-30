import type { SortingState, Table as ReactTable } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

interface SortOption {
  value: string
  label: string
  sorting: SortingState
}

interface TableControlsProps<TData> {
  table: ReactTable<TData>
  count: number
  /** Sufijo del conteo: se renderiza como `{count} {countLabel}` */
  countLabel: string
  /** Etiqueta del input de búsqueda: sirve como aria-label y placeholder */
  searchLabel: string
  /** aria-label del botón que abre el dropdown de orden */
  sortButtonLabel: string
  /** Id de la columna filtrable por el input de búsqueda */
  filterColumnId: string
  sortOptions: SortOption[]
}

export function TableControls<TData>({
  table,
  count,
  countLabel,
  searchLabel,
  sortButtonLabel,
  filterColumnId,
  sortOptions,
}: TableControlsProps<TData>) {
  const sorting = table.getState().sorting
  const selectedSort = sortOptions.find(
    (option) =>
      option.sorting.length === sorting.length &&
      option.sorting.every((sort, index) => sort.id === sorting[index]?.id && sort.desc === sorting[index]?.desc),
  )
  const sortLabel = selectedSort?.label ?? 'Orden original'

  const handleSortChange = (value: string) => {
    table.setSorting(sortOptions.find((option) => option.value === value)?.sorting ?? [])
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-secondary mr-auto text-xs">
        {count} {countLabel}
      </span>

      <Input
        aria-label={searchLabel}
        className="h-7 w-full text-xs placeholder:text-xs sm:w-48"
        onChange={(event) => table.getColumn(filterColumnId)?.setFilterValue(event.target.value)}
        placeholder={searchLabel}
        value={(table.getColumn(filterColumnId)?.getFilterValue() as string) ?? ''}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label={sortButtonLabel} className="h-7 px-2 text-xs" size="sm" type="button" variant="outline">
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
            {sortLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup onValueChange={handleSortChange} value={selectedSort?.value ?? 'original'}>
            {sortOptions.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
