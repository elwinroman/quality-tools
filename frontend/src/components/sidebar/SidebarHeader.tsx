import { PanelLeft } from 'lucide-react'

import { AplicationLogo, SwitchDatabase } from '@/components/shared'

interface Props {
  showDatabase?: boolean
  isCollapsed?: boolean
  /**
   * Si se omite, no se renderiza el botón de colapsar. Es el caso de las páginas
   * cuyo sidebar se colapsa desde afuera, porque al colapsarse deja de verse.
   */
  onToggleSidebar?(): void
}

export function SidebarHeader({ showDatabase = true, isCollapsed = false, onToggleSidebar }: Props) {
  return (
    // Altura fija: si la dictara el contenido, el SwitchDatabase la haría crecer y Aligment quedaría más bajo
    <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-4">
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
