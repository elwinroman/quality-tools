import { FileCode2 } from 'lucide-react'

export function SQLDefinitionEmptyState() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden select-none">
      {/* Grid decorativo de fondo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Halo radial */}
      <div className="to-background pointer-events-none absolute inset-0 bg-radial-[ellipse_60%_50%_at_50%_50%] from-transparent via-transparent opacity-80" />

      {/* Contenido */}
      <div className="relative flex flex-col items-center gap-5 text-center">
        <div className="bg-background-neutral border-border flex h-14 w-14 items-center justify-center rounded-xl border">
          <FileCode2 size={24} className="text-secondary" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-primary text-xl font-semibold tracking-tight">¿Qué objeto quieres inspeccionar?</h2>
          <p className="text-muted max-w-[300px] text-sm leading-relaxed">
            Busca un procedimiento, función, vista u otro objeto SQL en el panel izquierdo para ver su definición SQL.
          </p>
        </div>
      </div>
    </div>
  )
}
