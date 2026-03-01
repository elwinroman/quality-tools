import { format } from '@formkit/tempo'

import { LOCAL_LANGUAJE } from '@/enviroment/enviroment'

import { useUserTableStore } from '../store/usertable.store'

/** Convierte DD-MM-YYYY (formato de la API) a Date para @formkit/tempo. */
function toDate(value: string): Date {
  const [day, month, year] = value.split('-')
  return new Date(`${year}-${month}-${day}`)
}

interface MetaRowProps {
  label: string
  value: React.ReactNode
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-primary w-32 shrink-0 text-sm font-medium">{label}</span>
      <span className="bg-background-neutral text-secondary rounded px-2 py-0.5 text-xs">{value}</span>
    </div>
  )
}

export function UsertableOverviewContent() {
  const object = useUserTableStore((state) => state.userTableObject)
  const columns = useUserTableStore((state) => state.userTableColumnList)
  const indexes = useUserTableStore((state) => state.userTableIndexList)
  const foreignKeys = useUserTableStore((state) => state.userTableForeignKeyList)
  const extendedProperties = useUserTableStore((state) => state.userTableExtendedPropertieList)

  if (!object) return null

  return (
    <div className="flex h-full flex-col gap-5 overflow-auto p-6">
      {/* Metadata */}
      <section className="flex flex-col gap-2.5">
        <MetaRow label="Schema" value={object.schemaName} />
        <MetaRow label="Object ID" value={object.id} />
        <MetaRow label="Tipo" value={`${object.typeDesc} (${object.type})`} />
      </section>

      <div className="border-border border-t" />

      {/* Estadísticas */}
      <section className="flex gap-2">
        <div className="flex w-24 flex-col gap-0.5 rounded-lg border border-neutral-500/20 bg-neutral-500/10 p-2.5">
          <span className="text-xs text-neutral-500/70">Columnas</span>
          <span className="text-xl font-semibold text-neutral-500">{columns.length}</span>
        </div>
        <div className="flex w-24 flex-col gap-0.5 rounded-lg border border-neutral-500/20 bg-neutral-500/10 p-2.5">
          <span className="text-xs text-neutral-500/70">Índices</span>
          <span className="text-xl font-semibold text-neutral-500">{indexes.length}</span>
        </div>
        <div className="flex w-24 flex-col gap-0.5 rounded-lg border border-neutral-500/20 bg-neutral-500/10 p-2.5">
          <span className="text-xs text-neutral-500/70">Foreign keys</span>
          <span className="text-xl font-semibold text-neutral-500">{foreignKeys.length}</span>
        </div>
      </section>

      {/* Propiedades extendidas */}
      {extendedProperties.length > 0 && (
        <>
          <div className="border-border border-t" />

          <section className="flex flex-col gap-2">
            <span className="text-secondary text-xs font-medium tracking-wide uppercase">Propiedades extendidas</span>

            <div className="flex flex-col gap-2.5">
              {extendedProperties.map((prop, i) => (
                <MetaRow key={i} label={prop.propertyName} value={prop.propertyValue} />
              ))}
            </div>
          </section>
        </>
      )}

      <div className="border-border border-t" />

      {/* Fechas */}
      <section className="flex flex-col gap-1.5">
        <p className="text-secondary text-xs">
          Creado el <span className="text-primary font-medium">{format(toDate(object.createDate), 'full', LOCAL_LANGUAJE)}</span>
        </p>
        <p className="text-secondary text-xs">
          Modificado el <span className="text-primary font-medium">{format(toDate(object.modifyDate), 'full', LOCAL_LANGUAJE)}</span>
        </p>
      </section>
    </div>
  )
}
