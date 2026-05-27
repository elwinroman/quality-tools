import { GitBranch, Link2Off, Table2 } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Skeleton } from '@/components/ui'
import { AppRoutes } from '@/constants'
import { SysObjectRelation } from '@/models/sysobject'

import { useSysObjectStore } from '../store/sysobject.store'

interface RelationListProps {
  title: string
  description: string
  items: SysObjectRelation[]
  emptyMessage: string
  onSelect: (relation: SysObjectRelation) => void
  withDivider?: boolean
}

function canOpenRelation(relation: SysObjectRelation) {
  return relation.id !== null && relation.schemaName !== null
}

function RelationList({ title, description, items, emptyMessage, onSelect, withDivider = false }: RelationListProps) {
  return (
    <section
      className={
        withDivider
          ? 'border-border/60 flex flex-col gap-2 border-t pt-4'
          : 'border-border/50 flex flex-col gap-2 rounded-sm border px-3 py-3'
      }
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h3 className="text-primary text-sm font-semibold">{title}</h3>
          <span className="text-secondary text-xs">{items.length}</span>
        </div>
        <p className="text-secondary text-xs">{description}</p>
      </div>

      <div>
        {items.length === 0 ? (
          <div className="text-secondary py-1 text-xs">{emptyMessage}</div>
        ) : (
          <ul className="flex flex-col">
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
                      className="hover:bg-action-hover flex h-7 max-w-full items-center gap-2 rounded-sm px-2 text-left"
                      onClick={() => onSelect(relation)}
                    >
                      {isUserTable ? (
                        <Table2 size={13} className="text-secondary shrink-0" />
                      ) : (
                        <GitBranch size={13} className="text-secondary shrink-0" />
                      )}
                      <span className="text-secondary max-w-24 shrink-0 truncate text-xs">{schemaName}</span>
                      <span className="text-primary min-w-0 flex-1 truncate text-[13px]">{relation.name}</span>
                      <span className="text-secondary hidden shrink-0 text-[11px] lg:inline">{relation.typeDesc || 'No resuelto'}</span>
                    </button>
                  ) : (
                    <div className="flex h-7 min-w-0 items-center gap-2 px-2 opacity-70">
                      <Link2Off size={13} className="text-secondary shrink-0" />
                      <span className="text-secondary max-w-24 shrink-0 truncate text-xs">{schemaName}</span>
                      <span className="text-primary min-w-0 flex-1 truncate text-[13px]">{relation.name}</span>
                      <span className="text-secondary hidden shrink-0 text-[11px] lg:inline">{relation.typeDesc || 'No resuelto'}</span>
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
    <div className="flex h-full flex-col gap-5 overflow-auto p-4">
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-7 w-full max-w-xl" />
            <Skeleton className="h-7 w-full max-w-lg" />
            <Skeleton className="h-7 w-full max-w-md" />
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
    navigate(`${basePath}/${encodeURIComponent(relation.schemaName)}/${encodeURIComponent(relation.name)}`)
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
    <div className="flex h-full flex-col gap-4 overflow-auto p-5">
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
        withDivider
      />
    </div>
  )
}
