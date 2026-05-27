import { GitBranch, Link2Off, Table2 } from 'lucide-react'
import { useEffect } from 'react'

import { Button, Skeleton } from '@/components/ui'
import { SysObjectRelation } from '@/models/sysobject'

import { useSysObjectStore } from '../store/sysobject.store'

interface RelationListProps {
  title: string
  description: string
  items: SysObjectRelation[]
  emptyMessage: string
  onSelect: (id: number) => void
  withDivider?: boolean
}

function canOpenRelation(relation: SysObjectRelation) {
  return relation.id !== null && relation.typeDesc !== 'USER_TABLE'
}

function RelationList({ title, description, items, emptyMessage, onSelect, withDivider = false }: RelationListProps) {
  return (
    <section className={withDivider ? 'border-border flex flex-col gap-1.5 border-t pt-4' : 'flex flex-col gap-1.5'}>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h3 className="text-primary text-base font-semibold">{title}</h3>
          <span className="bg-background-neutral text-secondary rounded px-1.5 py-0.5 text-[10px] leading-none">{items.length}</span>
        </div>
        <p className="text-secondary text-xs">{description}</p>
      </div>

      <div>
        {items.length === 0 ? (
          <div className="text-secondary py-2 text-sm">{emptyMessage}</div>
        ) : (
          <ul className="flex flex-col gap-0.5">
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
                    <Button
                      variant="ghost"
                      className="h-6 max-w-full justify-start gap-2.5 px-0 py-0 text-left hover:bg-transparent hover:underline"
                      onClick={() => onSelect(relation.id as number)}
                    >
                      <span className="bg-background-neutral text-secondary max-w-28 shrink-0 truncate rounded px-1.5 py-0.5 text-[10px] leading-none">
                        {schemaName}
                      </span>
                      <span className="text-primary min-w-0 truncate text-[13px] font-semibold">{relation.name}</span>
                      <span className="text-secondary truncate text-[11px]">{relation.typeDesc || 'No resuelto'}</span>
                    </Button>
                  ) : (
                    <div className="flex h-6 min-w-0 items-center gap-2.5">
                      {isUserTable ? (
                        <Table2 size={12} className="text-secondary shrink-0" />
                      ) : (
                        <Link2Off size={12} className="text-secondary shrink-0" />
                      )}
                      <span className="bg-background-neutral text-secondary max-w-28 shrink-0 truncate rounded px-1.5 py-0.5 text-[10px] leading-none">
                        {schemaName}
                      </span>
                      <span className="text-primary min-w-0 truncate text-[13px] font-semibold">{relation.name}</span>
                      <span className="text-secondary truncate text-[11px]">
                        {isUserTable ? 'USER_TABLE' : relation.typeDesc || 'No resuelto'}
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
    <div className="flex h-full flex-col gap-5 overflow-auto p-6">
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-6 w-full max-w-xl" />
            <Skeleton className="h-6 w-full max-w-lg" />
            <Skeleton className="h-6 w-full max-w-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DependenciesContent() {
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const dependencies = useSysObjectStore((state) => state.dependencies)
  const dependents = useSysObjectStore((state) => state.dependents)
  const isLoadingRelations = useSysObjectStore((state) => state.isLoadingRelations)
  const errorRelations = useSysObjectStore((state) => state.errorRelations)
  const fetchSysObject = useSysObjectStore((state) => state.fetchSysObject)
  const fetchSysObjectRelations = useSysObjectStore((state) => state.fetchSysObjectRelations)

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
    <div className="flex h-full flex-col gap-4 overflow-auto p-6">
      <RelationList
        title="Objetos que lo referencian"
        description="Objetos relacionados que utilizan este objeto."
        items={dependents}
        emptyMessage="No hay referencias registradas."
        onSelect={fetchSysObject}
      />
      <RelationList
        title="Dependencias del objeto"
        description="Objetos relacionados que este objeto utiliza."
        items={dependencies}
        emptyMessage="Este objeto no registra dependencias."
        onSelect={fetchSysObject}
        withDivider
      />

      <p className="border-border text-secondary border-t pt-3 text-xs">
        La información mostrada es referencial y puede variar según la resolución disponible de la base de datos.
      </p>
    </div>
  )
}
