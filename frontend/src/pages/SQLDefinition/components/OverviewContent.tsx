import { OverviewCard, OverviewCollapsible, OverviewDateValue, OverviewDefinitionList } from '@/components/overview'
import { RelationsSection, useRelationNavigation } from '@/components/relations'
import { ContentTitle } from '@/components/shared'

import { useSysObjectStore } from '../store/sysobject.store'
import { PermissionChips } from './PermissionChips'

export function OverviewContent() {
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const dependencies = useSysObjectStore((state) => state.dependencies)
  const dependents = useSysObjectStore((state) => state.dependents)
  const isLoadingRelations = useSysObjectStore((state) => state.isLoadingRelations)
  const errorRelations = useSysObjectStore((state) => state.errorRelations)
  const fetchSysObjectRelations = useSysObjectStore((state) => state.fetchSysObjectRelations)
  const navigateToRelation = useRelationNavigation()

  if (!sysobject) return null

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <ContentTitle>Overview</ContentTitle>

      {/* Tarjeta unica: metadata y relaciones, sin titulo de encabezado */}
      <OverviewCard bodyClassName="p-0">
        <div className="p-3">
          <OverviewDefinitionList
            items={[
              { label: 'Tipo', value: `${sysobject.typeDesc} (${sysobject.type})`, spanFull: true },
              { label: 'Schema', value: sysobject.schemaName },
              { label: 'Object ID', value: sysobject.id },
              { label: 'Creado', value: <OverviewDateValue date={sysobject.createDate} /> },
              { label: 'Modificado', value: <OverviewDateValue date={sysobject.modifyDate} /> },
              { label: 'Permisos', value: <PermissionChips permissions={sysobject.permission} />, spanFull: true },
            ]}
          />
        </div>

        {/* Relaciones: fila interna de la tarjeta, plegada y con carga perezosa al expandir */}
        <div className="border-border border-t">
          <OverviewCollapsible
            title="Relaciones"
            className="rounded-none border-0"
            onExpand={() => {
              void fetchSysObjectRelations()
            }}
          >
            <RelationsSection
              dependencies={dependencies}
              dependents={dependents}
              isLoading={isLoadingRelations}
              error={errorRelations}
              onSelect={navigateToRelation}
            />
          </OverviewCollapsible>
        </div>
      </OverviewCard>
    </div>
  )
}
