import { Pilcrow } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'
import { useEditorOptionsStore } from '@/zustand'

export function NormalizeWhitespaceToggle() {
  const normalizeWhitespace = useEditorOptionsStore((state) => state.normalizeWhitespace)
  const updateNormalizeWhitespace = useEditorOptionsStore((state) => state.updateNormalizeWhitespace)

  const label = normalizeWhitespace ? 'Mostrar diferencias de whitespace' : 'Ignorar diferencias de whitespace'

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button
            className={`group h-7 rounded-sm px-2 transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.08] ${normalizeWhitespace ? 'bg-black/[0.08] dark:bg-white/[0.16]' : 'bg-transparent'}`}
            onClick={() => updateNormalizeWhitespace(!normalizeWhitespace)}
          >
            <Pilcrow size={14} className="text-primary group-hover:text-secondary" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
