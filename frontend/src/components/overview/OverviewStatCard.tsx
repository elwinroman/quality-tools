import { OverviewCard } from './OverviewCard'

interface OverviewStatCardProps {
  title: string
  /** Conteo mostrado como valor principal del cuadro. */
  count: number
}

/** Cuadro de estadistica compacto: titulo y conteo como valor prominente. */
export function OverviewStatCard({ title, count }: OverviewStatCardProps) {
  return (
    <OverviewCard title={title}>
      <span className="text-primary text-2xl font-semibold">{count}</span>
    </OverviewCard>
  )
}
