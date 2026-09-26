import { useEffect, useRef, useState } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { FavoritoProvider } from '@/components/favoritos'
import { DatabaseSwitchOverlay } from '@/components/loader'
import { DialogSearchProvider } from '@/components/search/context/dialogSearchContext'
import { ObjectSidebar } from '@/components/sidebar'
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
import { AppRoutes } from '@/constants'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { parseQualifiedSysObjectName } from '@/utilities/sysobject-route.util'
import { useAppStore, useAuthStore } from '@/zustand'

import { DependenciesContent, EditorCode, HeaderEditor, OverviewContent } from './components'
import { DiffScriptContent } from './components/diff-script-content/DiffScriptContent'
import { TabOption } from './constants/tabs-options'
import { useSysObjectStore } from './store/sysobject.store'

export function SQLDefinitionPage() {
  const { qualifiedName } = useParams()
  const database = useAuthStore((state) => state.authContext?.database)
  const switchingDatabase = useAppStore((state) => state.switchingDatabase)
  const leftPanelRef = useRef<ImperativePanelHandle>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(TabOption.Script)
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const fetchSysObjectByName = useSysObjectStore((state) => state.fetchSysObjectByName)
  const error = useSysObjectStore((state) => state.errorObject)
  const updateError = useSysObjectStore((state) => state.updateErrorObject)

  useEffect(() => {
    if (switchingDatabase) return

    const parsedName = parseQualifiedSysObjectName(qualifiedName)
    if (!parsedName) return

    const { schemaName, objectName } = parsedName
    setActiveTab(TabOption.Script)
    if (sysobject?.schemaName === schemaName && sysobject.name === objectName) return

    fetchSysObjectByName(schemaName, objectName)
  }, [fetchSysObjectByName, qualifiedName, switchingDatabase, sysobject?.name, sysobject?.schemaName])

  useEffect(() => {
    if (!error) return
    toast.error('Error', { description: error.detail })
    updateError(null)
  }, [error, updateError])

  // Al volver a desktop el drawer deja de existir: se limpia para que no reaparezca al achicar
  useEffect(() => {
    if (isDesktop) setDrawerOpen(false)
  }, [isDesktop])

  useEffect(() => {
    setActiveTab((currentTab) => (currentTab === TabOption.Compare ? TabOption.Script : currentTab))
  }, [database])

  useEffect(() => {
    if (!sysobject) return
    setActiveTab((currentTab) => (currentTab === TabOption.Compare ? TabOption.Script : currentTab))
  }, [sysobject])

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
          <FavoritoProvider type="ALL_EXCEPT_USERTABLE">
            {/* El provider envuelve el panel y el drawer para que el header del editor también lo vea */}
            <DialogSearchProvider>
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
                  className="max-w-[var(--width-sidebar)] transition-all"
                  collapsible={true}
                  collapsedSize={0}
                  ref={leftPanelRef}
                >
                  {isDesktop && (
                    <ObjectSidebar
                      onToggleSidebar={handleHidePanel}
                      isCollapsed={isCollapsed}
                      scope={{
                        searchType: 'ALL_EXCEPT_USERTABLE',
                        route: AppRoutes.SQL_DEFINITION,
                        activeObject: sysobject,
                        refetch: fetchSysObjectByName,
                      }}
                    />
                  )}
                </ResizablePanel>

                <ResizableHandle className={!isDesktop || !isCollapsed ? 'pointer-events-none' : ''} withHandle={false} />

                {/* Panel derecho: headers + editor */}
                <ResizablePanel>
                  {/* Contenedor flex: las Tabs necesitan un padre de altura definida para resolver su flex-1 */}
                  <div className="flex h-full flex-col">
                    <Tabs key={database} value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
                      <HeaderEditor activeTab={activeTab} onOpenSidebar={sidebarHidden ? handleRevealSidebar : undefined} />

                      <TabsContent value={TabOption.Overview} className="flex-1 overflow-hidden">
                        <OverviewContent />
                      </TabsContent>

                      <TabsContent value={TabOption.Script} className="flex-1 overflow-hidden">
                        <EditorCode />
                      </TabsContent>

                      <TabsContent value={TabOption.Dependencies} className="flex-1 overflow-hidden">
                        <DependenciesContent />
                      </TabsContent>

                      <TabsContent value={TabOption.Compare} className="flex-1 overflow-hidden">
                        <DiffScriptContent />
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
                    <ObjectSidebar
                      onToggleSidebar={() => setDrawerOpen(false)}
                      onNavigate={() => setDrawerOpen(false)}
                      scope={{
                        searchType: 'ALL_EXCEPT_USERTABLE',
                        route: AppRoutes.SQL_DEFINITION,
                        activeObject: sysobject,
                        refetch: fetchSysObjectByName,
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
