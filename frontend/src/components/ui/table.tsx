import { ComponentPropsWithoutRef, ComponentRef, forwardRef } from 'react'

import { cn } from '@/lib/utils'

const Table = forwardRef<ComponentRef<'table'>, ComponentPropsWithoutRef<'table'> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full table-auto caption-bottom border-0 text-sm', className)} {...props} />
    </div>
  ),
)
Table.displayName = 'Table'

const TableHeader = forwardRef<ComponentRef<'thead'>, ComponentPropsWithoutRef<'thead'> & { className?: string }>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />,
)
TableHeader.displayName = 'TableHeader'

const TableBody = forwardRef<ComponentRef<'tbody'>, ComponentPropsWithoutRef<'tbody'> & { className?: string }>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />,
)
TableBody.displayName = 'TableBody'

const TableFooter = forwardRef<ComponentRef<'tfoot'>, ComponentPropsWithoutRef<'tfoot'> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn('bg-muted/50 border-t font-medium last:[&>tr]:border-b-0', className)} {...props} />
  ),
)
TableFooter.displayName = 'TableFooter'

const TableRow = forwardRef<ComponentRef<'tr'>, ComponentPropsWithoutRef<'tr'> & { className?: string }>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn('hover:bg-action-hover data-[state=selected]:bg-action-hover border-border border-b transition-colors', className)}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = forwardRef<ComponentRef<'th'>, ComponentPropsWithoutRef<'th'> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'bg-background-neutral text-secondary h-12 pl-4 text-left align-middle font-semibold [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  ),
)
TableHead.displayName = 'TableHead'

const TableCell = forwardRef<ComponentRef<'td'>, ComponentPropsWithoutRef<'td'> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('border-0 py-3 pl-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
  ),
)
TableCell.displayName = 'TableCell'

const TableCaption = forwardRef<ComponentRef<'caption'>, ComponentPropsWithoutRef<'caption'> & { className?: string }>(
  ({ className, ...props }, ref) => <caption ref={ref} className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />,
)
TableCaption.displayName = 'TableCaption'

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow }
