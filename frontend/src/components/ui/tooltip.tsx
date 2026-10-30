import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

// Re-exportar directamente los componentes de Radix Tooltip
const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

// Tipado para el contenido del Tooltip
import type { TooltipContentProps } from '@radix-ui/react-tooltip'

const TooltipContent = forwardRef<React.ComponentRef<typeof TooltipPrimitive.Content>, TooltipContentProps & { className?: string }>(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'border-border bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded-sm border px-2 py-1 text-[0.6875rem] shadow-md',
        className,
      )}
      {...props}
    />
  ),
)

TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
