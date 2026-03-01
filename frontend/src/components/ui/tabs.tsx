import * as TabsPrimitive from '@radix-ui/react-tabs'
import { ComponentPropsWithoutRef, ComponentRef, forwardRef } from 'react'

import { cn } from '@/lib/utils'

// Tabs root exportado directamente
const Tabs = TabsPrimitive.Root

// TabsList con tipado correcto
const TabsList = forwardRef<
  ComponentRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { className?: string }
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('text-muted-foreground inline-flex h-12 items-center justify-center rounded-lg bg-inherit', className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

// TabsTrigger con tipado
const TabsTrigger = forwardRef<
  ComponentRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { className?: string }
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background-neutral data-[state=active]:text-foreground text-secondary inline-flex items-center justify-center rounded-md px-4 py-1 text-sm font-light whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

// TabsContent con tipado
const TabsContent = forwardRef<
  ComponentRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & { className?: string }
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'ring-offset-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Exportación
export { Tabs, TabsContent, TabsList, TabsTrigger }
