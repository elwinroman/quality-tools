import { Code2, GitCompare, Search, Settings, Shield } from 'lucide-react'
import { type ReactNode } from 'react'

import { TypeSysObjects } from '@/constants'
import { cn } from '@/lib/utils'

export function InfoSqlDefinition() {
  const typeSysObjectsArray = Object.entries(TypeSysObjects).map(([, value]) => ({
    type: value.type,
    description: value.description,
  }))

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Main: Objetos soportados — ocupa 2 columnas */}
      <Card className="sm:col-span-2">
        <CardIcon>
          <Code2 size={20} />
        </CardIcon>
        <CardTitle>Objetos soportados</CardTitle>
        <CardDescription>Explora el código fuente de todos estos objetos directamente desde los metadatos de MSSQL Server.</CardDescription>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {typeSysObjectsArray.map((obj) => (
            <div key={obj.type} className="bg-background-neutral flex items-center gap-3 rounded-lg px-3 py-2.5">
              <span className="grid h-6 w-6 shrink-0 place-content-center rounded bg-amber-500/15 text-xs font-bold text-amber-600 dark:text-amber-400">
                {obj.type}
              </span>
              <span className="text-secondary text-sm">{obj.description}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Compara scripts */}
      <Card>
        <CardIcon>
          <GitCompare size={20} />
        </CardIcon>
        <CardTitle>Compara scripts</CardTitle>
        <CardDescription>
          Comparación side-by-side de objetos SQL entre bases de datos para detectar diferencias al instante.
        </CardDescription>
      </Card>

      {/* Editor personalizable */}
      <Card>
        <CardIcon>
          <Settings size={20} />
        </CardIcon>
        <CardTitle>Editor personalizable</CardTitle>
        <CardDescription>Editor Monaco con soporte SQL: elige tema, tamaño de fuente y opciones de visualización.</CardDescription>
      </Card>

      {/* Gestor de roles */}
      <Card>
        <CardIcon>
          <Shield size={20} />
        </CardIcon>
        <CardTitle>Gestor de roles</CardTitle>
        <CardDescription>Visualiza y gestiona los roles y permisos asociados a cada objeto de la base de datos.</CardDescription>
      </Card>

      {/* Búsqueda rápida */}
      <Card>
        <CardIcon>
          <Search size={20} />
        </CardIcon>
        <CardTitle>Búsqueda rápida</CardTitle>
        <CardDescription>Encuentra cualquier objeto en segundos con el buscador integrado. Filtra por nombre y tipo.</CardDescription>
      </Card>
    </div>
  )
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-background-paperchanel shadow-custom-card border-border flex flex-col gap-3 rounded-xl border p-6', className)}>
      {children}
    </div>
  )
}

function CardIcon({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
      {children}
    </div>
  )
}

function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-primary text-base font-semibold">{children}</h3>
}

function CardDescription({ children }: { children: ReactNode }) {
  return <p className="text-secondary text-sm text-balance">{children}</p>
}
