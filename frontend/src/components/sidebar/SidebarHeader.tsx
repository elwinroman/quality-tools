import { PanelLeft } from 'lucide-react'

import { AplicationLogo, SwitchDatabase } from '@/components/shared'

interface Props {
  /** Muestra el selector de base de datos activa. */
  showDatabase?: boolean
  /** Oculta el botón de colapsar cuando el panel ya está colapsado. */
  isCollapsed?: boolean
  /**
   * Si se omite, no se renderiza el botón de colapsar. Es el caso de las páginas
   * cuyo sidebar se colapsa desde afuera, porque al colapsarse deja de verse.
   */
  onToggleSidebar?(): void
}

/**
 * Fila superior del sidebar: marca, selector de base de datos y botón para colapsar.
 *
 * Es reutilizable por cualquier página; lo único opcional es la base de datos.
 */
export function SidebarHeader({ showDatabase = true, isCollapsed = false, onToggleSidebar }: Props) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2">
      <AplicationLogo />

      {showDatabase && <SwitchDatabase className="min-w-0 flex-1" />}

      {!isCollapsed && onToggleSidebar && (
        <button
          type="button"
          className="hover:bg-background-neutral shrink-0 rounded-sm px-1 py-1"
          onClick={onToggleSidebar}
          aria-label="Ocultar panel lateral"
        >
          <PanelLeft size={16} />
        </button>
      )}
    </div>
  )
}
