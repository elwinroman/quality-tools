import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'
import { copyToClipboard } from '@/utilities'

interface Props {
  text: string
  className?: string
  disabled?: boolean
}

export function CopyCode({ text, className = '', disabled = false }: Props) {
  const [copy, setCopy] = useState(false)
  const message = !copy ? 'Copiar script' : 'Copiado!'

  // Copia al clipboard
  const handleCopy = () => {
    if (!text) return

    copyToClipboard({ text })
    setCopy(true)

    setTimeout(() => setCopy(false), 3500)
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button
            className={`group h-7 rounded-sm px-2 not-disabled:hover:bg-white/[0.08] ${className}`}
            onClick={handleCopy}
            disabled={disabled} // Asignar el estado de deshabilitado
          >
            {!copy ? (
              <Copy size={14} className="group-hover:text-secondary group-disabled:text-disabled text-primary" />
            ) : (
              <Check size={14} className="text-palette-success-main" strokeWidth={3} />
            )}
          </button>
        </TooltipTrigger>
        {!disabled && (
          <TooltipContent side="bottom">
            <p>{message}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
