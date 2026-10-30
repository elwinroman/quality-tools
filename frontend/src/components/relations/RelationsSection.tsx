import { Skeleton } from '@/components/ui'
import { SysObjectRelation } from '@/models/sysobject'

import { SysObjectRelationLists } from './RelationList'

interface RelationsError {
  title: string
  detail: string
}

interface RelationsSectionProps {
  dependencies: SysObjectRelation[]
  dependents: SysObjectRelation[]
  isLoading: boolean
  error: RelationsError | null
  onSelect: (relation: SysObjectRelation) => void
}

/** Estado de carga compacto mientras se resuelven las relaciones. */
function RelationsLoadingState() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 rounded-none" />
          <Skeleton className="h-9 rounded-none" />
        </div>
      ))}
    </div>
  )
}

/**
 * Contenido de relaciones segun su estado: carga, error o los dos bloques.
 * Unica fuente del estado de carga/error que comparten los dos Overview.
 */
export function RelationsSection({ dependencies, dependents, isLoading, error, onSelect }: RelationsSectionProps) {
  if (isLoading) return <RelationsLoadingState />

  if (error) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-primary text-sm font-semibold">{error.title}</p>
        <p className="text-secondary text-xs">{error.detail}</p>
      </div>
    )
  }

  return <SysObjectRelationLists dependencies={dependencies} dependents={dependents} onSelect={onSelect} />
}
