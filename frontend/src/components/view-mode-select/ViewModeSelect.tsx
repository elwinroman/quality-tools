import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger } from '@/components/ui'
import { TypeViewsList } from '@/constants'
import { ViewMode } from '@/models/sysobject'

interface Props {
  value: ViewMode
  onChange(value: ViewMode): void
}

/**
 * Selector de vista del código (Full / Solo Objeto / Solo Roles).
 *
 * Presentacional: el estado lo aporta cada página desde su propio store, así que este
 * componente se reusa igual en Definición SQL y en Aligment.
 */
export function ViewModeSelect({ value, onChange }: Props) {
  const currentName = TypeViewsList.find((view) => view.id === value)?.name ?? value

  return (
    <Select value={value} onValueChange={(next) => onChange(next as ViewMode)}>
      {/*
        Sin SelectValue: el trigger dibuja el chevron solo, así no se filtra el texto del
        valor seleccionado. Sin tooltip: cual es la vista actual se ve al abrir, con el check.
      */}
      <SelectTrigger
        aria-label={`Vista: ${currentName}`}
        className="hover:bg-action-hover h-7 w-7 justify-center border-0 bg-transparent px-0 py-0 transition-colors"
      />

      <SelectContent>
        <SelectGroup>
          <SelectLabel className="text-secondary pl-2 text-[10px] uppercase">Vista</SelectLabel>
          <SelectSeparator />
          {TypeViewsList.map((view) => (
            <SelectItem key={view.id} value={view.id} className="text-primary text-xs">
              {view.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
