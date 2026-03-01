import { useAligmentStore } from '@aligment/zustand/aligment.store'
import { PanelLeft } from 'lucide-react'

import { EditorAligmentOption } from './EditorAligmentOption'

export function HeaderEditor() {
  const hideMenu = useAligmentStore((state) => state.hideMenu)
  const updateHideMenu = useAligmentStore((state) => state.updateHideMenu)
  const sysobject = useAligmentStore((state) => state.sysobject)

  const fullName = sysobject ? `${sysobject.schemaName}.${sysobject.name}` : ''

  const handleHideMenu = () => updateHideMenu(!hideMenu)

  return (
    <header className="dark:bg-background bg-action-hover flex flex-col justify-start gap-x-5 gap-y-2 px-4 py-2.5 sm:items-center lg:flex-row lg:justify-between">
      <button className="hover:bg-background-neutral rounded-sm px-1 py-1" onClick={handleHideMenu}>
        <PanelLeft size={16} />
      </button>

      <div className="flex flex-[0_0_auto] flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-primary text-sm font-semibold dark:font-medium">{fullName}</h4>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Pre-producción
          </span>
        </div>
      </div>

      {/* Opciones del editor */}
      <EditorAligmentOption className="flex-[1_1_0]" />
    </header>
  )
}
