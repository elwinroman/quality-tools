import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { FavoritoProvider } from '@/components/favoritos'
import { DatabaseSwitchOverlay } from '@/components/loader'
import { DialogSearchProvider } from '@/components/search/context/dialogSearchContext'
import { ObjectSidebar } from '@/components/sidebar'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, Tabs, TabsContent } from '@/components/ui'
import { AppRoutes } from '@/constants'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { parseQualifiedSysObjectName } from '@/utilities/sysobject-route.util'
import { useAppStore, useAuthStore } from '@/zustand'

import { Columns } from './components/Columns'
import { DataTable } from './components/DataTable'
import { HeaderUsertable } from './components/HeaderUsertable'
import { IndexColumns } from './components/IndexColumns'
import { IndexDataTable } from './components/IndexDataTable'
import { UsertableEmptyState } from './components/UsertableEmptyState'
import { UsertableOverviewContent } from './components/UsertableOverviewContent'
import { TabOption } from './constants/tab-options'
import { useUserTableStore } from './store/usertable.store'

export function UsertablePage() {
  const { qualifiedName } = useParams()
  const database = useAuthStore((state) => state.authContext?.database)
  const switchingDatabase = useAppStore((state) => state.switchingDatabase)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const loading = useUserTableStore((state) => state.loading)
  const object = useUserTableStore((state) => state.userTableObject)
  const fetchUserTableByName = useUserTableStore((state) => state.fetchUserTableByName)
  const error = useUserTableStore((state) => state.userTableError)
  const updateError = useUserTableStore((state) => state.updateUsertableError)

  useEffect(() => {
    if (switchingDatabase) return

    const parsedName = parseQualifiedSysObjectName(qualifiedName)
    if (!parsedName) return

    const { schemaName, objectName } = parsedName
    if (object?.schemaName === schemaName && object.name === objectName) return

    fetchUserTableByName(schemaName, objectName)
  }, [fetchUserTableByName, object?.name, object?.schemaName, qualifiedName, switchingDatabase])

  useEffect(() => {
    if (!error) return
    toast.error('Error', { description: error.detail })
    updateError(null)
  }, [error, updateError])

  // Al volver a desktop el drawer deja de existir: se limpia para que no reaparezca al achicar
  useEffect(() => {
    if (isDesktop) setDrawerOpen(false)
  }, [isDesktop])

  const handleHidePanel = () => setIsCollapsed((prev) => !prev)

  // El reveal del sidebar vive en el header del editor: en mobile abre el drawer, en desktop expande el panel
  const sidebarHidden = !isDesktop || isCollapsed
  const handleRevealSidebar = () => {
    if (isDesktop) handleHidePanel()
    else setDrawerOpen(true)
  }

  return (
    <section className="bg-background flex h-full w-full flex-col">
      <main className="relative h-full w-full overflow-hidden">
        <section className="bg-background relative flex h-full w-full overflow-hidden">
          <FavoritoProvider type="U">
            {/* El provider envuelve el panel y el drawer para que el header del editor también lo vea */}
            <DialogSearchProvider>
              {/* Sidebar izquierdo - full height. Por debajo de lg vive en el drawer, por eso se oculta. */}
              <aside
                className={`bg-background relative hidden h-full shrink-0 transition-all duration-300 ease-in-out lg:block ${isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-sidebar opacity-100'}`}
              >
                {isDesktop && (
                  <ObjectSidebar
                    onToggleSidebar={handleHidePanel}
                    isCollapsed={isCollapsed}
                    scope={{
                      searchType: 'U',
                      route: AppRoutes.USERTABLE,
                      activeObject: object,
                      refetch: fetchUserTableByName,
                    }}
                  />
                )}
              </aside>

              {/* Panel derecho: headers + tabs content */}
              <div className="flex h-full min-w-0 flex-1 flex-col">
                {/* Contenedor flex: las Tabs necesitan un padre de altura definida para resolver su flex-1 */}
                <Tabs key={database} defaultValue={TabOption.Structure} className="flex min-h-0 flex-1 flex-col">
                  <HeaderUsertable onOpenSidebar={sidebarHidden ? handleRevealSidebar : undefined} />

                  {/* Tab Estructura: es el tab por defecto, por eso recibe el estado vacío */}
                  <TabsContent value={TabOption.Structure} className={cn('flex-1 overflow-auto', object && !loading && 'px-4 py-4')}>
                    {!object ? (
                      <UsertableEmptyState />
                    ) : loading ? (
                      <div className="text-secondary flex h-full items-center justify-center text-sm">Cargando...</div>
                    ) : (
                      <DataTable columns={Columns} />
                    )}
                  </TabsContent>

                  {/* Tab Overview */}
                  <TabsContent value={TabOption.Overview} className="flex-1 overflow-auto">
                    <UsertableOverviewContent />
                  </TabsContent>

                  {/* Tab Índices */}
                  <TabsContent value={TabOption.Indexes} className="flex-1 overflow-auto px-4 py-4">
                    {loading ? (
                      <div className="text-secondary flex h-full items-center justify-center text-sm">Cargando...</div>
                    ) : (
                      <IndexDataTable columns={IndexColumns} />
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Drawer lateral en mobile: el sidebar vive aquí por debajo del breakpoint lg */}
              {/* modal={false}: el sidebar abre un Popover portado a body; en un Sheet modal
                  Radix deja `pointer-events: none` en body y el select de base queda inusable */}
              {!isDesktop && (
                <Sheet modal={false} open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Panel lateral</SheetTitle>
                      <SheetDescription>Navegación, búsqueda y favoritos.</SheetDescription>
                    </SheetHeader>
                    <ObjectSidebar
                      onToggleSidebar={() => setDrawerOpen(false)}
                      onNavigate={() => setDrawerOpen(false)}
                      scope={{
                        searchType: 'U',
                        route: AppRoutes.USERTABLE,
                        activeObject: object,
                        refetch: fetchUserTableByName,
                      }}
                    />
                  </SheetContent>
                </Sheet>
              )}
            </DialogSearchProvider>
          </FavoritoProvider>
        </section>
        <DatabaseSwitchOverlay />
      </main>
    </section>
  )
}
