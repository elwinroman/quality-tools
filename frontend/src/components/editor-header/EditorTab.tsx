import type { LucideIcon } from 'lucide-react'

import { TabsTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  label: string
  icon: LucideIcon
  disabled?: boolean
  accent?: 'gentlePink'
}

/**
 * Tab del header del editor. Usa el mismo criterio de hover y activo que los items
 * de menú del sidebar: fondo `action-hover` y texto primario al apuntar o al estar
 * activo, arrancando en secundario.
 */
export function EditorTab({ value, label, icon: Icon, disabled, accent }: Props) {
  const isGentlePink = accent === 'gentlePink'

  return (
    <TabsTrigger
      value={value}
      disabled={disabled}
      className={cn(
        'group h-8 gap-2 rounded-sm px-2.5 text-xs shadow-none transition-colors data-[state=active]:shadow-none',
        isGentlePink
          ? 'hover:bg-gentle-pink-100 data-[state=active]:bg-gentle-pink-100 data-[state=active]:text-gentle-pink-700 dark:hover:bg-gentle-pink-900/20 dark:data-[state=active]:bg-gentle-pink-900/30 dark:data-[state=active]:text-gentle-pink-300'
          : 'hover:bg-action-hover data-[state=active]:bg-action-hover data-[state=active]:text-primary',
      )}
    >
      <Icon
        size={14}
        className={cn(
          'text-secondary shrink-0 transition-colors',
          isGentlePink
            ? 'group-hover:text-gentle-pink-700 group-data-[state=active]:text-gentle-pink-700 dark:group-hover:text-gentle-pink-400 dark:group-data-[state=active]:text-gentle-pink-300'
            : 'group-hover:text-primary group-data-[state=active]:text-primary',
        )}
      />

      <span
        className={cn(
          'text-primary/60 transition-colors',
          isGentlePink
            ? 'group-hover:text-gentle-pink-700 group-data-[state=active]:text-gentle-pink-700 dark:group-hover:text-gentle-pink-400 dark:group-data-[state=active]:text-gentle-pink-300'
            : 'group-hover:text-primary group-data-[state=active]:text-primary',
        )}
      >
        {label}
      </span>
    </TabsTrigger>
  )
}
