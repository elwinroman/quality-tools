import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { TypeViewsList } from '@/constants'
import { ViewMode } from '@/models/sysobject'

import { useSysObjectStore } from '../../store/sysobject.store'

export function ViewModeSelect() {
  const viewMode = useSysObjectStore((state) => state.viewMode)
  const updateViewMode = useSysObjectStore((state) => state.updateViewMode)

  const handleChange = (value: ViewMode) => updateViewMode(value)

  return (
    <div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Vista</span>
        <Select value={viewMode} onValueChange={(value) => handleChange(value as ViewMode)}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {TypeViewsList.map((view) => (
                <SelectItem key={view.id} value={view.id} className="text-primary">
                  {view.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </label>
    </div>
  )
}
