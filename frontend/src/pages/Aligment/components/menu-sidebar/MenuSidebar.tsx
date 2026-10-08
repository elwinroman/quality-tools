import { useSearchContext } from '@aligment/hooks'
import { Info } from 'lucide-react'

import { CircleLoader } from '@/components/loader'
import { Sidebar, SidebarFooter, SidebarHeader, SidebarNav } from '@/components/sidebar'
import { useDismissibleNotice } from '@/hooks/useDismissibleNotice'
import { useAppStore, useAuthStore } from '@/zustand'

import { ButtonGroup, InfoCard, SearchAligment } from './components'

/**
 * Botón que reabre el aviso de Aligment después de cerrarlo: usa el mismo key que
 * `InfoCard`, así la reapertura la sincroniza el hook vía su evento de navegador.
 */
function ReopenInfoButton() {
  const { reopen } = useDismissibleNotice('aligment-info')

  return (
    <button
      type="button"
      className="text-secondary hover:text-primary hover:bg-action-hover grid h-7 w-7 shrink-0 cursor-pointer place-content-center rounded-sm transition-colors"
      onClick={reopen}
      aria-label="Mostrar el aviso de alineación"
      title="Mostrar el aviso de alineación"
    >
      <Info size={14} />
    </button>
  )
}

interface Props {
  className?: string
  /** Oculta el botón de colapsar dentro del sidebar cuando ya está colapsado. */
  isCollapsed?: boolean
  onToggleSidebar?(): void
}

/**
 * Sidebar de Aligment. Reutiliza el marco, el header, la navegación y el footer
 * compartidos; lo propio es el cuerpo de consulta.
 *
 * No se le pasa el toggle de colapsar a propósito: acá el sidebar se colapsa desde
 * su propio header y, una vez colapsado, se lo revela desde el header del editor.
 */
export function MenuSidebar({ className = '', isCollapsed = false, onToggleSidebar }: Props) {
  const authContext = useAuthStore((state) => state.authContext)
  const isDark = useAppStore((state) => state.isDark)
  const { loading } = useSearchContext()

  return (
    <Sidebar
      className={className}
      header={<SidebarHeader showDatabase={false} isCollapsed={isCollapsed} onToggleSidebar={onToggleSidebar} />}
      footer={
        <>
          {/* Aviso cerrable, pegado arriba del bloque de perfil */}
          <InfoCard />

          <SidebarFooter footerAction={<ReopenInfoButton />} />
        </>
      }
    >
      {/* Navegación entre páginas: sólo con sesión, porque sus destinos son protegidos */}
      {authContext && <SidebarNav className="shrink-0" />}

      {/* Cuerpo propio de Aligment */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Input */}
          <SearchAligment />

          {/* Buttons */}
          <ButtonGroup />

          {/* Loader */}
          {loading && (
            <div className="relative mt-4">
              <CircleLoader size={20} visible={true} color={isDark ? 'white' : 'black'} />
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  )
}
