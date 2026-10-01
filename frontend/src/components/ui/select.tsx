import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

// Alias
const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

type SelectTriggerProps = React.ComponentPropsWithRef<typeof SelectPrimitive.Trigger>

const SelectTrigger = forwardRef<React.ComponentRef<typeof SelectPrimitive.Trigger>, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'ring-offset-background placeholder:text-muted bg-background-paperchanel flex h-10 w-full items-center justify-between rounded-sm border border-gray-500/20 px-3 py-2 text-xs focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ),
)
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

type ScrollButtonProps = React.ComponentPropsWithRef<typeof SelectPrimitive.ScrollUpButton>

const SelectScrollUpButton = forwardRef<React.ComponentRef<typeof SelectPrimitive.ScrollUpButton>, ScrollButtonProps>(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton ref={ref} className={cn('flex cursor-default items-center justify-center py-1', className)} {...props}>
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  ),
)
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = forwardRef<React.ComponentRef<typeof SelectPrimitive.ScrollDownButton>, ScrollButtonProps>(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  ),
)
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

type SelectContentProps = React.ComponentPropsWithRef<typeof SelectPrimitive.Content> & {
  position?: 'item-aligned' | 'popper'
}

const SelectContent = forwardRef<React.ComponentRef<typeof SelectPrimitive.Content>, SelectContentProps>(
  ({ className, children, position = 'popper', ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'bg-background text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-sm border shadow-md',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  ),
)
SelectContent.displayName = SelectPrimitive.Content.displayName

type LabelProps = React.ComponentPropsWithRef<typeof SelectPrimitive.Label>

const SelectLabel = forwardRef<React.ComponentRef<typeof SelectPrimitive.Label>, LabelProps>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn('py-1.5 pr-2 pl-8 text-xs font-semibold', className)} {...props} />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

type ItemProps = React.ComponentPropsWithRef<typeof SelectPrimitive.Item>

const SelectItem = forwardRef<React.ComponentRef<typeof SelectPrimitive.Item>, ItemProps>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'focus:bg-action-hover focus:text-accent-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-xs outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3 w-3 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3 w-3" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

type SeparatorProps = React.ComponentPropsWithRef<typeof SelectPrimitive.Separator>

const SelectSeparator = forwardRef<React.ComponentRef<typeof SelectPrimitive.Separator>, SeparatorProps>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn('bg-border -mx-1 my-1 h-px', className)} {...props} />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
