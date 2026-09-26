import type { LucideIcon } from 'lucide-react'

import { TabsTrigger } from '@/components/ui'

interface Props {
  value: string
  label: string
  icon: LucideIcon
  disabled?: boolean
}

/**
 * Tab del header del editor. Usa el mismo criterio de hover y activo que los items
 * de menú del sidebar: fondo `action-hover` y texto primario al apuntar o al estar
 * activo, arrancando en secundario.
 */
export function EditorTab({ value, label, icon: Icon, disabled }: Props) {
  return (
    <TabsTrigger
      value={value}
      disabled={disabled}
      className="group border-border hover:bg-action-hover data-[state=active]:bg-action-hover data-[state=active]:text-primary h-7 gap-1.5 rounded-sm border px-2 text-xs shadow-none transition-colors data-[state=active]:shadow-none"
    >
      <Icon
        size={12}
        className="text-secondary group-hover:text-primary group-data-[state=active]:text-primary shrink-0 transition-colors"
      />

      <span className="text-primary/60 group-hover:text-primary group-data-[state=active]:text-primary transition-colors">{label}</span>
    </TabsTrigger>
  )
}
