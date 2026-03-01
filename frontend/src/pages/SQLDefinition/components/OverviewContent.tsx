import { format } from '@formkit/tempo'
import { Shield } from 'lucide-react'

import { LOCAL_LANGUAJE } from '@/enviroment/enviroment'

import { useSysObjectStore } from '../store/sysobject.store'

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

export function OverviewContent() {
  const sysobject = useSysObjectStore((state) => state.sysobject)

  if (!sysobject) return null

  return (
    <div className="flex h-full flex-col gap-5 overflow-auto p-6">
      {/* Metadata */}
      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-2.5">
          <MetaRow label="Schema" value={sysobject.schemaName} />
          <MetaRow label="Object ID" value={sysobject.id} />
          <MetaRow label="Tipo" value={`${sysobject.typeDesc} (${sysobject.type})`} />
        </div>
      </section>

      <div className="border-border border-t" />

      {/* Fechas */}
      <section className="flex flex-col gap-1.5">
        <p className="text-secondary text-xs">
          Creado el <span className="text-primary font-medium">{format(sysobject.createDate, 'full', LOCAL_LANGUAJE)}</span>
        </p>
        <p className="text-secondary text-xs">
          Modificado el <span className="text-primary font-medium">{format(sysobject.modifyDate, 'full', LOCAL_LANGUAJE)}</span>
        </p>
      </section>

      {/* Permisos */}
      {sysobject.permission.length > 0 && (
        <>
          <div className="border-border border-t" />

          <section className="flex flex-col gap-2">
            <span className="text-secondary text-xs font-medium tracking-wide uppercase">Permisos</span>

            <div className="flex flex-col gap-1.5">
              {sysobject.permission.map((perm, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-primary w-32 shrink-0 text-sm font-medium">{perm.name}</span>
                  <span className="bg-background-neutral text-secondary rounded px-2 py-0.5 text-xs">{perm.permissionName}</span>
                  <span className="text-secondary inline-flex items-center gap-1 text-xs">
                    <Shield size={11} />
                    {perm.stateDesc}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
