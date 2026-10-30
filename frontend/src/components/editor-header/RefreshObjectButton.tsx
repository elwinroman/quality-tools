import { RefreshCw } from 'lucide-react'

import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'

interface Props {
  onClick(): void
  /** Texto del tooltip, ej. "Refrescar objeto". */
  label: string
  disabled?: boolean
}

/** Botón de refrescar del header del editor, con su tooltip. */
export function RefreshObjectButton({ onClick, label, disabled }: Props) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={disabled} onClick={onClick}>
            <RefreshCw size={14} className="text-primary" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
