import { OverviewCard, OverviewCollapsible, OverviewDateValue, OverviewDefinitionList, OverviewStatCard } from '@/components/overview'
import { RelationsSection, useRelationNavigation } from '@/components/relations'
import { ContentTitle } from '@/components/shared'

import { useUserTableStore } from '../store/usertable.store'

/** Convierte DD-MM-YYYY (formato de la API) a Date para @formkit/tempo. */
function toDate(value: string): Date {
  const [day, month, year] = value.split('-')
  return new Date(`${year}-${month}-${day}`)
}

export function UsertableOverviewContent() {
  const object = useUserTableStore((state) => state.userTableObject)
  const columns = useUserTableStore((state) => state.userTableColumnList)
  const indexes = useUserTableStore((state) => state.userTableIndexList)
  const foreignKeys = useUserTableStore((state) => state.userTableForeignKeyList)
  const extendedProperties = useUserTableStore((state) => state.userTableExtendedPropertieList)
  const dependencies = useUserTableStore((state) => state.dependencies)
  const dependents = useUserTableStore((state) => state.dependents)
  const isLoadingRelations = useUserTableStore((state) => state.isLoadingRelations)
  const errorRelations = useUserTableStore((state) => state.errorRelations)
  const fetchUserTableRelations = useUserTableStore((state) => state.fetchUserTableRelations)
  const navigateToRelation = useRelationNavigation()

  if (!object) return null

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <ContentTitle>Overview</ContentTitle>

      {/* Tarjeta unica: metadata y relaciones, sin titulo de encabezado */}
      <OverviewCard bodyClassName="p-0">
        <div className="p-3">
          <OverviewDefinitionList
            items={[
              { label: 'Tipo', value: `${object.typeDesc} (${object.type})`, spanFull: true },
              { label: 'Schema', value: object.schemaName },
              { label: 'Object ID', value: object.id },
              { label: 'Creado', value: <OverviewDateValue date={toDate(object.createDate)} /> },
              { label: 'Modificado', value: <OverviewDateValue date={toDate(object.modifyDate)} /> },
            ]}
          />
        </div>

        {/* Relaciones: fila interna de la tarjeta, plegada y con carga perezosa al expandir */}
        <div className="border-border border-t">
          <OverviewCollapsible
            title="Relaciones"
            className="rounded-none border-0"
            onExpand={() => {
              void fetchUserTableRelations()
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

      {/* Cuadros de estadistica */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <OverviewStatCard title="Columnas" count={columns.length} />
        <OverviewStatCard title="Índices" count={indexes.length} />
        <OverviewStatCard title="Foreign keys" count={foreignKeys.length} />
      </div>

      {/* Fila colapsable: propiedades extendidas */}
      {extendedProperties.length > 0 && (
        <OverviewCollapsible title="Propiedades extendidas" count={extendedProperties.length}>
          <OverviewDefinitionList
            items={extendedProperties.map((property) => ({ label: property.propertyName, value: property.propertyValue }))}
          />
        </OverviewCollapsible>
      )}
    </div>
  )
}
