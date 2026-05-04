import { Combobox as ComboboxPrimitive } from '@base-ui/react'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const Combobox = ComboboxPrimitive.Root

function ComboboxInput({
  className,
  leading,
  disabled = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  disabled?: boolean
  leading?: React.ReactNode
}) {
  return (
    <div className="relative">
      {leading && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">{leading}</span>}
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        disabled={disabled}
        className={cn(
          'bg-background-paperchanel ring-offset-background placeholder:text-muted flex h-10 w-full rounded-sm border border-gray-500/20 px-3 py-2 pr-9 text-xs outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          leading && 'pl-9',
          className,
        )}
        {...props}
      />
      <ComboboxPrimitive.Trigger
        data-slot="combobox-trigger"
        disabled={disabled}
        className="text-muted absolute top-0 right-0 flex h-10 w-9 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronDownIcon className="h-4 w-4 opacity-50" />
      </ComboboxPrimitive.Trigger>
    </div>
  )
}

function ComboboxContent({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props & Pick<ComboboxPrimitive.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'>) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            'mix-colored-background bg-background-paperchanel text-popover-foreground w-[var(--anchor-width)] min-w-[var(--anchor-width)] overflow-hidden rounded-sm border shadow-md outline-hidden',
            'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List data-slot="combobox-list" className={cn('max-h-60 overflow-y-auto p-1 data-empty:p-0', className)} {...props} />
  )
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        'data-highlighted:bg-action-hover data-highlighted:text-accent-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-xs outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        data-slot="combobox-item-indicator"
        render={<span className="pointer-events-none absolute right-2 flex h-3 w-3 items-center justify-center" />}
      >
        <CheckIcon className="h-3 w-3" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        'text-muted hidden w-full justify-center px-2 py-2 text-center text-xs group-data-empty/combobox-content:flex',
        className,
      )}
      {...props}
    />
  )
}

export { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList }
