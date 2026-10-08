import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

type HomeInfoCardProps = {
  children: ReactNode
  className?: string
}

export function HomeInfoCard({ children, className }: HomeInfoCardProps) {
  return <div className={cn('bg-background-card shadow-custom-card border-border flex flex-col gap-3 rounded-xl border p-6', className)}>{children}</div>
}
