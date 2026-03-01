import { AlignLeft, Code2, GitMerge, Search, Sidebar } from 'lucide-react'
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function InfoAligment() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Main: Comparación side-by-side — ocupa 2 columnas */}
      <Card className="sm:col-span-2">
        <CardIcon>
          <GitMerge size={20} />
        </CardIcon>
        <CardTitle>Comparación side-by-side</CardTitle>
        <CardDescription>
          Visualiza en paralelo los scripts SQL de dos bases de datos distintas. Las diferencias se resaltan de forma clara para una
          revisión precisa.
        </CardDescription>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="bg-background-neutral rounded-lg px-3 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-secondary text-xs font-medium">Prueba (Test)</span>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <p className="text-primary">CREATE PROCEDURE CRE_Proc</p>
              <p className="rounded bg-green-500/10 px-1 text-green-600 dark:text-green-400">+ @userId INT,</p>
              <p className="text-primary">{'  '}@status NVARCHAR(50)</p>
              <p className="text-muted">AS BEGIN ...</p>
            </div>
          </div>
          <div className="bg-background-neutral rounded-lg px-3 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-secondary text-xs font-medium">Pre-producción</span>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <p className="text-primary">CREATE PROCEDURE CRE_Proc</p>
              <p className="rounded bg-rose-500/10 px-1 text-rose-600 dark:text-rose-400">- @id INT,</p>
              <p className="text-primary">{'  '}@status NVARCHAR(50)</p>
              <p className="text-muted">AS BEGIN ...</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Sidebar de búsqueda */}
      <Card>
        <CardIcon>
          <Sidebar size={20} />
        </CardIcon>
        <CardTitle>Sidebar de búsqueda</CardTitle>
        <CardDescription>Panel lateral con búsqueda en tiempo real. Encuentra y navega entre objetos SQL rápidamente.</CardDescription>
      </Card>

      {/* Múltiples objetos */}
      <Card>
        <CardIcon>
          <Code2 size={20} />
        </CardIcon>
        <CardTitle>Múltiples objetos</CardTitle>
        <CardDescription>Alinea procedimientos, funciones, vistas y triggers entre cualquier par de bases de datos.</CardDescription>
      </Card>

      {/* Filtros de búsqueda */}
      <Card>
        <CardIcon>
          <Search size={20} />
        </CardIcon>
        <CardTitle>Filtros de búsqueda</CardTitle>
        <CardDescription>Filtra por nombre, tipo de objeto y base de datos para encontrar lo que necesitas al instante.</CardDescription>
      </Card>

      {/* Ignorar whitespace */}
      <Card>
        <CardIcon>
          <AlignLeft size={20} />
        </CardIcon>
        <CardTitle>Ignorar whitespace</CardTitle>
        <CardDescription>
          Activa la opción para ignorar diferencias de espacios en blanco y enfocarte solo en cambios reales del código.
        </CardDescription>
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
    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
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
