import { Download } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'

interface Props {
  text: string
  className?: string
  disabled?: boolean
  filename: string
}

export function DownloadScript({ text, className = '', disabled = false, filename }: Props) {
  // Copia al clipboard
  const handleDownload = () => {
    if (!text || !filename) return

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    // Crear un enlace de descarga
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.sql` // El nombre del archivo a descargar
    link.click()

    // Liberar el URL creado
    URL.revokeObjectURL(url)
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button
            className={`group not-disabled:hover:bg-action-hover h-7 rounded-sm px-2 ${className}`}
            onClick={handleDownload}
            disabled={disabled} // Asignar el estado de deshabilitado
          >
            <Download size={14} className="group-hover:text-secondary group-disabled:text-disabled text-primary" />
          </button>
        </TooltipTrigger>
        {!disabled && (
          <TooltipContent side="bottom">
            <p>Descargar script</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
