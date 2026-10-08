import { ArrowUpRight, GitBranch, Link2Off, Table2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { OverviewCard } from '@/components/overview'
import { AppRoutes } from '@/constants'
import { cn } from '@/lib/utils'
import { SysObjectRelation } from '@/models/sysobject'
import { buildQualifiedSysObjectPath } from '@/utilities/sysobject-route.util'

interface RelationListProps {
  title: string
  description: string
  items: SysObjectRelation[]
  emptyMessage: string
  onSelect: (relation: SysObjectRelation) => void
}

/** Una relacion es navegable solo si tiene id y schema resueltos. */
function canOpenRelation(relation: SysObjectRelation) {
  return relation.id !== null && relation.schemaName !== null
}

/** Chip de tipo de objeto: contorno, para que lea sobre la superficie del card. */
function RelationTypeBadge({ typeDesc }: { typeDesc: string }) {
  return (
    <span className="border-border text-secondary hidden shrink-0 rounded-sm border px-1.5 py-0.5 text-[11px] lg:inline">
      {typeDesc || 'No resuelto'}
    </span>
  )
}

/**
 * Bloque de relaciones: titulo, descripcion, badge de conteo y lista de filas.
 * Compartido entre el tab Relaciones y los Overview de SQLDefinition y Usertable.
 */
export function RelationList({ title, description, items, emptyMessage, onSelect }: RelationListProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-primary text-sm font-semibold">{title}</h3>
          <p className="text-secondary text-xs">{description}</p>
        </div>
        <span className="border-border text-muted rounded-sm border px-1.5 py-0.5 text-[11px] leading-none">{items.length}</span>
      </div>

      {/* Titulo y descripcion fuera de la tarjeta; el contenido no lleva bordes de tabla */}
      <OverviewCard bodyClassName="p-0" className="overflow-hidden">
        {items.length === 0 ? (
          <div className="text-muted px-3 py-3 text-xs">{emptyMessage}</div>
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
                      className="group flex min-h-9 max-w-full items-center gap-2 px-3 text-left"
                      onClick={() => onSelect(relation)}
                    >
                      {isUserTable ? (
                        <Table2 size={13} className="text-muted shrink-0" />
                      ) : (
                        <GitBranch size={13} className="text-muted shrink-0" />
                      )}
                      <span className="text-muted group-hover:text-secondary max-w-28 shrink-0 truncate text-xs transition-colors">
                        {schemaName}
                      </span>
                      <span className="text-primary min-w-0 flex-1 truncate text-[13px] font-medium group-hover:underline">
                        {relation.name}
                      </span>
                      <RelationTypeBadge typeDesc={relation.typeDesc} />
                      <ArrowUpRight size={13} className="text-muted shrink-0" />
                    </button>
                  ) : (
                    <div className={cn('flex min-h-9 min-w-0 items-center gap-2 px-3 opacity-55')}>
                      <Link2Off size={13} className="text-muted shrink-0" />
                      <span className="text-muted max-w-28 shrink-0 truncate text-xs">{schemaName}</span>
                      <span className="text-primary min-w-0 flex-1 truncate text-[13px]">{relation.name}</span>
                      <RelationTypeBadge typeDesc={relation.typeDesc} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </OverviewCard>
    </section>
  )
}

/** Devuelve el handler que navega al objeto relacionado segun su tipo. */
export function useRelationNavigation() {
  const navigate = useNavigate()

  return (relation: SysObjectRelation) => {
    if (!relation.schemaName) return

    const basePath = relation.typeDesc === 'USER_TABLE' ? AppRoutes.USERTABLE : AppRoutes.SQL_DEFINITION
    navigate(buildQualifiedSysObjectPath(basePath, relation.schemaName, relation.name))
  }
}

interface SysObjectRelationListsProps {
  dependencies: SysObjectRelation[]
  dependents: SysObjectRelation[]
  onSelect: (relation: SysObjectRelation) => void
}

/**
 * Los dos bloques de relaciones (Referencias y Dependencias) con su copy existente.
 * Unica fuente de los textos: la usan el tab Relaciones y los dos Overview.
 */
export function SysObjectRelationLists({ dependencies, dependents, onSelect }: SysObjectRelationListsProps) {
  return (
    // Una al lado de la otra; en mobile se apilan. Dependencias primero.
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <RelationList
        title="Dependencias"
        description="Objetos que este objeto utiliza."
        items={dependencies}
        emptyMessage="Sin dependencias."
        onSelect={onSelect}
      />
      <RelationList
        title="Referencias"
        description="Objetos que utilizan este objeto."
        items={dependents}
        emptyMessage="Sin referencias."
        onSelect={onSelect}
      />
    </div>
  )
}
