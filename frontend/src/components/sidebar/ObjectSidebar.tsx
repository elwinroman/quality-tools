import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { FavoritosList, useFavoritoContext } from '@/components/favoritos'
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

  const navigateToObject = (schema: string, name: string) => {
    if (!scope) return

    if (scope.activeObject?.schemaName === schema && scope.activeObject.name === name) {
      scope.refetch(schema, name)
      return
    }

    navigate(buildQualifiedSysObjectPath(scope.route, schema, name))
  }

  return (
    <Sidebar
      header={<SidebarHeader showDatabase={showDatabase} isCollapsed={isCollapsed} onToggleSidebar={onToggleSidebar} />}
      footer={<SidebarFooter />}
    >
      <div className="flex flex-col gap-4 px-2 py-4">
        {/* Navegación entre páginas */}
        {showNav && <SidebarNav className="shrink-0" onNavigate={onNavigate} />}

        {/* Cuerpo propio de la página */}
        {children}

        {/* Búsqueda y favoritos: sólo tienen sentido con un contexto de objeto */}
        {scope && (
          <>
            {/* El modal vive acá; el disparador está en el header del editor */}
            <SearchProvider type={scope.searchType} onSelect={navigateToObject}>
              <Search />
            </SearchProvider>

            {/* Favoritos: grupo propio, con el mismo padding que el grupo de menús */}
            <div className="flex min-h-0 flex-1 flex-col">
              <FavoritosList
                favoritos={favoritos}
                onDelete={deleteFavorito}
                onSelect={navigateToObject}
                activeObjectName={scope.activeObject?.name}
                activeSchema={scope.activeObject?.schemaName}
              />
            </div>
          </>
        )}
      </div>
    </Sidebar>
  )
}
