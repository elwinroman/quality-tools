import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { FavoritoProvider } from '@/components/favoritos'
import { DatabaseSwitchOverlay } from '@/components/loader'
import { DialogSearchProvider } from '@/components/search/context/dialogSearchContext'
import { ObjectSidebar } from '@/components/sidebar'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, Tabs, TabsContent } from '@/components/ui'
import { AppRoutes } from '@/constants'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePersistentTab } from '@/hooks/usePersistentTab'
import { parseQualifiedSysObjectName } from '@/utilities/sysobject-route.util'
import { useAppStore, useAuthStore } from '@/zustand'

import { EditorCode, HeaderEditor, OverviewContent } from './components'
import { DiffScriptContent } from './components/diff-script-content/DiffScriptContent'
import { TabOption } from './constants/tabs-options'
import { useSysObjectStore } from './store/sysobject.store'

export function SQLDefinitionPage() {
  const { qualifiedName } = useParams()
  const database = useAuthStore((state) => state.authContext?.database)
  const switchingDatabase = useAppStore((state) => state.switchingDatabase)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const fetchSysObjectByName = useSysObjectStore((state) => state.fetchSysObjectByName)
  const error = useSysObjectStore((state) => state.errorObject)
  const updateError = useSysObjectStore((state) => state.updateErrorObject)
  // Memoria del tab entre menús: se resetea al cambiar de objeto y usa Script si el tab recordado no está disponible
  const [activeTab, setActiveTab] = usePersistentTab('sqldefinition', qualifiedName, TabOption.Script, Boolean(sysobject))

  useEffect(() => {
    if (switchingDatabase) return

    const parsedName = parseQualifiedSysObjectName(qualifiedName)
    if (!parsedName) return

    const { schemaName, objectName } = parsedName
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

  // Invalidación de Compare: el ref con el valor del mount hace que el effect
  // salte en el primer commit y solo corra cuando el valor cambia de verdad.
  // Sin eso, un Compare recordado en el slot se pisaría siempre al volver al menú.
  const previousDatabase = useRef(database)
  const previousSysobject = useRef(sysobject)

  useEffect(() => {
    if (previousDatabase.current === database) return
    previousDatabase.current = database
    setActiveTab((currentTab) => (currentTab === TabOption.Compare ? TabOption.Script : currentTab))
  }, [database])

  useEffect(() => {
    if (previousSysobject.current === sysobject) return
    previousSysobject.current = sysobject
    if (!sysobject) return
    setActiveTab((currentTab) => (currentTab === TabOption.Compare ? TabOption.Script : currentTab))
  }, [sysobject])

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
          <FavoritoProvider type="ALL_EXCEPT_USERTABLE">
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
                      searchType: 'ALL_EXCEPT_USERTABLE',
                      route: AppRoutes.SQL_DEFINITION,
                      activeObject: sysobject,
                      refetch: fetchSysObjectByName,
                    }}
                  />
                )}
              </aside>

              {/* Panel derecho: headers + editor */}
              <div className="flex h-full min-w-0 flex-1 flex-col">
                {/* Contenedor flex: las Tabs necesitan un padre de altura definida para resolver su flex-1 */}
                <Tabs key={database} value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
                  <HeaderEditor activeTab={activeTab} onOpenSidebar={sidebarHidden ? handleRevealSidebar : undefined} />

                  <TabsContent value={TabOption.Overview} className="flex-1 overflow-hidden">
                    <OverviewContent />
                  </TabsContent>

                  <TabsContent value={TabOption.Script} className="flex-1 overflow-hidden">
                    <EditorCode />
                  </TabsContent>

                  <TabsContent value={TabOption.Compare} className="flex-1 overflow-hidden">
                    <DiffScriptContent />
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
