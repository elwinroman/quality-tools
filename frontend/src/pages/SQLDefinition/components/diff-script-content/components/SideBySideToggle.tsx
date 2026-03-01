import { Rows2 } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'
import { useEditorOptionsStore } from '@/zustand'

export function SideBySideToggle() {
  const renderSideBySide = useEditorOptionsStore((state) => state.renderSideBySide)
  const updateRenderSideBySide = useEditorOptionsStore((state) => state.updateRenderSideBySide)

  const label = renderSideBySide ? 'Mostrar diferencia en filas' : 'Mostrar diferencia en columnas'

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button
            className={`group h-7 rounded-sm px-2 transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.08] ${!renderSideBySide ? 'bg-black/[0.08] dark:bg-white/[0.16]' : 'bg-transparent'}`}
            onClick={() => updateRenderSideBySide(!renderSideBySide)}
          >
            <Rows2 size={14} className="text-primary group-hover:text-secondary" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
