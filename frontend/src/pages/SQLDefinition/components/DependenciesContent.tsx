import { GitBranch, Link2Off, Table2 } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Skeleton } from '@/components/ui'
import { AppRoutes } from '@/constants'
import { cn } from '@/lib/utils'
import { SysObjectRelation } from '@/models/sysobject'
import { buildQualifiedSysObjectPath } from '@/utilities/sysobject-route.util'

import { useSysObjectStore } from '../store/sysobject.store'

interface RelationListProps {
  title: string
  description: string
  items: SysObjectRelation[]
  emptyMessage: string
  onSelect: (relation: SysObjectRelation) => void
}

function canOpenRelation(relation: SysObjectRelation) {
  return relation.id !== null && relation.schemaName !== null
}

function RelationList({ title, description, items, emptyMessage, onSelect }: RelationListProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-primary text-sm font-semibold">{title}</h3>
          <p className="text-secondary text-xs">{description}</p>
        </div>
        <span className="border-border text-muted rounded-sm border px-1.5 py-0.5 text-[11px] leading-none">{items.length}</span>
      </div>

      <div className="border-border/60 overflow-hidden rounded-sm border">
        {items.length === 0 ? (
          <div className="text-secondary px-3 py-3 text-xs">{emptyMessage}</div>
        ) : (
          <ul className="divide-border/60 flex flex-col divide-y">
            {items.map((relation, index) => {
              const schemaName = relation.schemaName ?? '(sin schema)'
              const isUserTable = relation.typeDesc === 'USER_TABLE'
              const isOpenable = canOpenRelation(relation)

              return (
                <li
                  key={`${relation.id ?? 'unresolved'}-${relation.schemaName ?? 'unknown'}-${relation.name}-${index}`}
                  className="min-w-0"
                >
                  {isOpenable ? (
                    <button
                      type="button"
                      className="hover:bg-action-hover flex min-h-9 max-w-full items-center gap-2 px-3 text-left transition-colors"
                      onClick={() => onSelect(relation)}
                    >
                      {isUserTable ? (
                        <Table2 size={13} className="text-muted shrink-0" />
                      ) : (
                        <GitBranch size={13} className="text-muted shrink-0" />
                      )}
                      <span className="text-muted max-w-28 shrink-0 truncate text-xs">{schemaName}</span>
                      <span className="text-primary min-w-0 flex-1 truncate text-[13px] font-medium">{relation.name}</span>
                      <span className="bg-background-neutral text-muted hidden shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] lg:inline">
                        {relation.typeDesc || 'No resuelto'}
                      </span>
                    </button>
                  ) : (
                    <div className={cn('flex min-h-9 min-w-0 items-center gap-2 px-3 opacity-55')}>
                      <Link2Off size={13} className="text-muted shrink-0" />
                      <span className="text-muted max-w-28 shrink-0 truncate text-xs">{schemaName}</span>
                      <span className="text-primary min-w-0 flex-1 truncate text-[13px]">{relation.name}</span>
                      <span className="bg-background-neutral text-muted hidden shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] lg:inline">
                        {relation.typeDesc || 'No resuelto'}
                      </span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

function LoadingState() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-auto p-5">
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-7 rounded-sm" />
          </div>
          <div className="border-border/60 overflow-hidden rounded-sm border">
            <Skeleton className="h-9 rounded-none" />
            <Skeleton className="h-9 rounded-none" />
            <Skeleton className="h-9 rounded-none" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DependenciesContent() {
  const navigate = useNavigate()
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const dependencies = useSysObjectStore((state) => state.dependencies)
  const dependents = useSysObjectStore((state) => state.dependents)
  const isLoadingRelations = useSysObjectStore((state) => state.isLoadingRelations)
  const errorRelations = useSysObjectStore((state) => state.errorRelations)
  const fetchSysObjectRelations = useSysObjectStore((state) => state.fetchSysObjectRelations)
  const navigateToRelation = (relation: SysObjectRelation) => {
    if (!relation.schemaName) return

    const basePath = relation.typeDesc === 'USER_TABLE' ? AppRoutes.USERTABLE : AppRoutes.SQL_DEFINITION
    navigate(buildQualifiedSysObjectPath(basePath, relation.schemaName, relation.name))
  }

  useEffect(() => {
    if (sysobject) fetchSysObjectRelations()
  }, [fetchSysObjectRelations, sysobject])

  if (!sysobject) return null
  if (isLoadingRelations) return <LoadingState />

  if (errorRelations) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <GitBranch size={28} className="text-secondary" />
        <h3 className="text-primary text-sm font-semibold">{errorRelations.title}</h3>
        <p className="text-secondary max-w-md text-sm">{errorRelations.detail}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto p-5">
      <RelationList
        title="Referencias"
        description="Objetos que utilizan este objeto."
        items={dependents}
        emptyMessage="Sin referencias."
        onSelect={navigateToRelation}
      />
      <RelationList
        title="Dependencias"
        description="Objetos que este objeto utiliza."
        items={dependencies}
        emptyMessage="Sin dependencias."
        onSelect={navigateToRelation}
      />
    </div>
  )
}
