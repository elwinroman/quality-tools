import { type ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { FavoritosNav, useFavoritoContext } from '@/components/favoritos'
import { SearchProvider } from '@/components/search/context/searchContext'
import { Search } from '@/components/search/Search'
import { ApiSysObjectType } from '@/models/sysobject'
import { buildQualifiedSysObjectPath } from '@/utilities/sysobject-route.util'

import { Sidebar } from './Sidebar'
import { SidebarFooter } from './SidebarFooter'
import { SidebarHeader } from './SidebarHeader'
import { SidebarNav } from './SidebarNav'

/** Contexto de objeto: lo que ata la búsqueda y los favoritos a un tipo de objeto. */
export interface ObjectScope {
  /** Tipo de búsqueda que entiende el endpoint de sugerencias. */
  searchType: ApiSysObjectType
  /** Ruta base a la que saltar cuando el objeto pedido no es el activo. */
  route: string
  /** Objeto que se está viendo, para marcar el favorito correspondiente. */
  activeObject: { name: string; schemaName: string } | null
  /** Vuelve a pedir el objeto cuando se selecciona el que ya está activo. */
  refetch(schema: string, name: string): void
}

interface Props {
  /**
   * Contexto de objeto. Sin él no se muestran la búsqueda ni los favoritos,
   * porque ambos están atados a un tipo de objeto concreto.
   */
  scope?: ObjectScope
  /** Navegación entre páginas. */
  showNav?: boolean
  /** Selector de base de datos activa en el header. */
  showDatabase?: boolean
  /** Cuerpo propio de la página, entre la navegación y los favoritos. */
  children?: ReactNode
  onToggleSidebar(): void
  onNavigate?(): void
  isCollapsed?: boolean
}

/**
 * Sidebar de las páginas que trabajan con un objeto: arma la base con el header,
 * la navegación, el footer de perfil y, si hay contexto de objeto, la búsqueda y
 * los favoritos. Para una página que no trabaja con objetos, conviene componer
 * `Sidebar` con las piezas reutilizables en vez de usar este componente.
 */
export function ObjectSidebar({
  scope,
  showNav = true,
  showDatabase = true,
  children,
  onToggleSidebar,
  onNavigate,
  isCollapsed = false,
}: Props) {
  const navigate = useNavigate()
  const { favoritos, deleteFavorito } = useFavoritoContext()
  const [favoritesResetSignal, setFavoritesResetSignal] = useState(0)

  const navigateToObject = (schema: string, name: string) => {
    if (!scope) return

    if (scope.activeObject?.schemaName === schema && scope.activeObject.name === name) {
      scope.refetch(schema, name)
      return
    }

    navigate(buildQualifiedSysObjectPath(scope.route, schema, name))
  }

  // Vuelve a la pantalla principal de favoritos al plegar el sidebar o navegar,
  // para que no reaparezca a mitad del drill-down.
  const handleToggleSidebar = () => {
    setFavoritesResetSignal((signal) => signal + 1)
    onToggleSidebar()
  }

  const handleNavigate = () => {
    setFavoritesResetSignal((signal) => signal + 1)
    onNavigate?.()
  }

  return (
    <Sidebar
      header={<SidebarHeader showDatabase={showDatabase} isCollapsed={isCollapsed} onToggleSidebar={handleToggleSidebar} />}
      footer={<SidebarFooter />}
    >
      <div className="flex flex-col gap-4">
        {/* Navegación entre páginas */}
        {showNav && <SidebarNav className="shrink-0" onNavigate={handleNavigate} />}

        {/* Cuerpo propio de la página */}
        {children}

        {/* Búsqueda y favoritos: sólo tienen sentido con un contexto de objeto */}
        {scope && (
          <>
            {/* El modal vive acá; el disparador está en el header del editor */}
            <SearchProvider type={scope.searchType} onSelect={navigateToObject}>
              <Search />
            </SearchProvider>

            {/* Favoritos: entrada que abre la pantalla de grupos (drill-down) */}
            <div className="flex min-h-0 flex-1 flex-col">
              <FavoritosNav
                favoritos={favoritos}
                onDelete={deleteFavorito}
                onSelect={navigateToObject}
                activeObjectName={scope.activeObject?.name}
                activeSchema={scope.activeObject?.schemaName}
                resetSignal={favoritesResetSignal}
              />
            </div>
          </>
        )}
      </div>
    </Sidebar>
  )
}
