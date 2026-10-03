import { format } from '@formkit/tempo'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'
import { LOCAL_LANGUAJE } from '@/enviroment/enviroment'

interface OverviewDateValueProps {
  /** Fecha o cadena ISO 8601 parseable por @formkit/tempo. */
  date: Date | string
}

/** Fecha corta dd/mm/yyyy; al pasar el mouse muestra el formato largo en un tooltip. */
export function OverviewDateValue({ date }: OverviewDateValueProps) {
  const shortDate = format(date, 'DD/MM/YYYY', LOCAL_LANGUAJE)
  const fullDate = format(date, 'full', LOCAL_LANGUAJE)

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <span className="cursor-default">{shortDate}</span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{fullDate}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
