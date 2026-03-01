import { Columns, Layers, LayoutPanelLeft, Search, Star } from 'lucide-react'
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

const EXAMPLE_COLUMNS = [
  { name: 'id', type: 'INT', nullable: false },
  { name: 'nombre', type: 'NVARCHAR(100)', nullable: false },
  { name: 'descripcion', type: 'NVARCHAR(500)', nullable: true },
  { name: 'fecha_creacion', type: 'DATETIME', nullable: false },
  { name: 'activo', type: 'BIT', nullable: false },
]

export function InfoUsertable() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Main: Estructura de columnas — ocupa 2 columnas */}
      <Card className="sm:col-span-2">
        <CardIcon>
          <Columns size={20} />
        </CardIcon>
        <CardTitle>Estructura de columnas</CardTitle>
        <CardDescription>
          Visualiza el esquema completo de cualquier tabla: nombre de columna, tipo de dato, longitud y nullabilidad.
        </CardDescription>
        <div className="border-border mt-2 overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="bg-background-neutral border-border border-b">
                <th className="text-muted px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Columna</th>
                <th className="text-muted px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Tipo</th>
                <th className="text-muted px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Nullable</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLE_COLUMNS.map((col, idx) => (
                <tr
                  key={col.name}
                  className={cn('border-border border-b last:border-0', idx % 2 === 0 ? 'bg-background' : 'bg-background-paperchanel')}
                >
                  <td className="text-primary px-3 py-2 font-mono text-xs">{col.name}</td>
                  <td className="text-secondary px-3 py-2 font-mono text-xs">{col.type}</td>
                  <td className="px-3 py-2 text-xs">
                    {col.nullable ? <span className="text-muted">NULL</span> : <span className="text-primary font-medium">NOT NULL</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Explorador de índices */}
      <Card>
        <CardIcon>
          <Layers size={20} />
        </CardIcon>
        <CardTitle>Explorador de índices</CardTitle>
        <CardDescription>
          Revisa todos los índices definidos sobre tus tablas: clustered, non-clustered, únicos y compuestos.
        </CardDescription>
      </Card>

      {/* Paneles resizables */}
      <Card>
        <CardIcon>
          <LayoutPanelLeft size={20} />
        </CardIcon>
        <CardTitle>Paneles resizables</CardTitle>
        <CardDescription>Ajusta el espacio del panel de navegación y el contenido principal a tu flujo de trabajo.</CardDescription>
      </Card>

      {/* Búsqueda de tablas */}
      <Card>
        <CardIcon>
          <Search size={20} />
        </CardIcon>
        <CardTitle>Búsqueda de tablas</CardTitle>
        <CardDescription>Encuentra cualquier tabla con el buscador integrado. Resultados en tiempo real mientras escribís.</CardDescription>
      </Card>

      {/* Favoritos */}
      <Card>
        <CardIcon>
          <Star size={20} />
        </CardIcon>
        <CardTitle>Favoritos</CardTitle>
        <CardDescription>Marca tus tablas más usadas para acceder rápidamente a ellas en tu próxima sesión.</CardDescription>
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
    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
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
