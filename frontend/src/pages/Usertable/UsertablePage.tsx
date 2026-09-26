import { useEffect, useRef, useState } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { FavoritoProvider } from '@/components/favoritos'
import { DatabaseSwitchOverlay } from '@/components/loader'
import { DialogSearchProvider } from '@/components/search/context/dialogSearchContext'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
} from '@/components/ui'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { parseQualifiedSysObjectName } from '@/utilities/sysobject-route.util'
import { useAppStore, useAuthStore } from '@/zustand'

import { Columns } from './components/Columns'
import { DataTable } from './components/DataTable'
import { HeaderTabsUsertable } from './components/HeaderTabsUsertable'
import { HeaderUsertable } from './components/HeaderUsertable'
import { IndexColumns } from './components/IndexColumns'
import { IndexDataTable } from './components/IndexDataTable'
import { UsertableEmptyState } from './components/UsertableEmptyState'
import { UsertableOverviewContent } from './components/UsertableOverviewContent'
import { UsertablePanelEditor } from './components/UsertablePanelEditor'
import { TabOption } from './constants/tab-options'
import { useUserTableStore } from './store/usertable.store'

export function UsertablePage() {
  const { qualifiedName } = useParams()
  const database = useAuthStore((state) => state.authContext?.database)
  const switchingDatabase = useAppStore((state) => state.switchingDatabase)
  const leftPanelRef = useRef<ImperativePanelHandle>(null)
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

  const handleHidePanel = () => {
    if (!leftPanelRef.current) return

    const isCollapsedCurrent = leftPanelRef.current.isCollapsed()
    setIsCollapsed(!isCollapsedCurrent)

    if (isCollapsedCurrent) leftPanelRef.current.expand()
    else leftPanelRef.current.collapse()
  }

  // El reveal del sidebar vive en el header del editor: en mobile abre el drawer, en desktop expande el panel
  const sidebarHidden = !isDesktop || isCollapsed
  const handleRevealSidebar = () => {
    if (isDesktop) handleHidePanel()
    else setDrawerOpen(true)
  }

  return (
    <section className="bg-background flex h-full w-full flex-col">
      <main className="relative h-full w-full overflow-hidden">
        <section className="bg-background-paperchanel relative h-full w-full overflow-hidden">
          <FavoritoProvider type="U">
            <ResizablePanelGroup
              key={isDesktop ? 'desktop' : 'mobile'}
              direction="horizontal"
              onLayout={(sizes) => {
                const [leftSize] = sizes
                setIsCollapsed(leftSize === 0)
              }}
            >
              {/* Sidebar izquierdo - full height */}
              <ResizablePanel
                minSize={isCollapsed ? 0 : 10}
                defaultSize={isDesktop ? 15 : 0}
                maxSize={15}
                className="transition-all"
                collapsible={true}
                collapsedSize={0}
                ref={leftPanelRef}
              >
                {isDesktop && (
                  <DialogSearchProvider>
                    <UsertablePanelEditor onToggleSidebar={handleHidePanel} isCollapsed={isCollapsed} />
                  </DialogSearchProvider>
                )}
              </ResizablePanel>

              <ResizableHandle className={!isDesktop || !isCollapsed ? 'pointer-events-none' : ''} withHandle={false} />

              {/* Panel derecho: headers + tabs content */}
              <ResizablePanel>
                {/* Contenedor flex: las Tabs necesitan un padre de altura definida para resolver su flex-1 */}
                <div className="flex h-full flex-col">
                  <Tabs key={database} defaultValue={TabOption.Structure} className="flex min-h-0 flex-1 flex-col">
                    <HeaderUsertable onOpenSidebar={sidebarHidden ? handleRevealSidebar : undefined} />
                    <HeaderTabsUsertable />

                    {/* Tab Estructura */}
                    <TabsContent value={TabOption.Structure} className={cn('flex-1 overflow-auto', object && !loading && 'px-4 py-4')}>
                      {loading ? (
                        <div className="text-secondary flex h-full items-center justify-center text-sm">Cargando...</div>
                      ) : (
                        <DataTable columns={Columns} />
                      )}
                    </TabsContent>

                    {/* Tab Overview */}
                    <TabsContent value={TabOption.Overview} className="flex-1 overflow-auto">
                      {!object ? <UsertableEmptyState /> : <UsertableOverviewContent />}
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
              </ResizablePanel>
            </ResizablePanelGroup>

            {/* Drawer lateral en mobile: el sidebar vive aquí por debajo del breakpoint lg */}
            {!isDesktop && (
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Panel lateral</SheetTitle>
                    <SheetDescription>Navegación, búsqueda y favoritos.</SheetDescription>
                  </SheetHeader>
                  <DialogSearchProvider>
                    <UsertablePanelEditor onToggleSidebar={() => setDrawerOpen(false)} onNavigate={() => setDrawerOpen(false)} />
                  </DialogSearchProvider>
                </SheetContent>
              </Sheet>
            )}
          </FavoritoProvider>
        </section>
        <DatabaseSwitchOverlay />
      </main>
    </section>
  )
}
