import { PanelLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { FavoritosList, useFavoritoContext } from '@/components/favoritos'
import { SearchTrigger } from '@/components/search/components/SearchTrigger'
import { SearchProvider } from '@/components/search/context/searchContext'
import { Search } from '@/components/search/Search'
import { AplicationLogo, LoginUsername, SwitchDatabase } from '@/components/shared'
import { SidebarNav } from '@/components/sidebar'
import { AppRoutes } from '@/constants'
import { buildQualifiedSysObjectPath } from '@/utilities/sysobject-route.util'

import { useUserTableStore } from '../store/usertable.store'

interface Props {
  onToggleSidebar(): void
  onNavigate?: () => void
  isCollapsed?: boolean
}

export function UsertablePanelEditor({ onToggleSidebar, onNavigate, isCollapsed = false }: Props) {
  const navigate = useNavigate()
  const { favoritos, deleteFavorito } = useFavoritoContext()
  const object = useUserTableStore((state) => state.userTableObject)
  const fetchUserTableByName = useUserTableStore((state) => state.fetchUserTableByName)
  const navigateToUserTable = (schema: string, name: string) => {
    if (object?.schemaName === schema && object.name === name) {
      fetchUserTableByName(schema, name)
      return
    }

    navigate(buildQualifiedSysObjectPath(AppRoutes.USERTABLE, schema, name))
  }

  return (
    <div className="border-border bg-background flex h-full flex-col border-r">
      {/* Logo + base de datos activa + botón que oculta el sidebar */}
      <div className="flex shrink-0 items-center gap-2 px-4 py-2">
        <AplicationLogo />

        <SwitchDatabase className="min-w-0 flex-1" />

        {!isCollapsed && (
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

      {/* Navegación entre páginas */}
      <SidebarNav className="shrink-0 px-4 py-2" onNavigate={onNavigate} />

      {/* Controles superiores */}
      <div className="flex shrink-0 flex-col gap-7 px-4 py-6">
        <SearchProvider type="U" onSelect={navigateToUserTable}>
          <SearchTrigger />
          <Search />
        </SearchProvider>
      </div>

      {/* Favoritos: grupo propio, con el mismo padding que el grupo de menús */}
      <div className="flex min-h-0 flex-1 flex-col px-4 py-2">
        <FavoritosList
          favoritos={favoritos}
          onDelete={deleteFavorito}
          onSelect={navigateToUserTable}
          activeObjectName={object?.name}
          activeSchema={object?.schemaName}
        />
      </div>

      {/* Perfil del usuario */}
      <footer className="flex shrink-0 items-center px-4 py-2">
        <LoginUsername />
      </footer>
    </div>
  )
}
