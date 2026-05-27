import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { FavoritoProvider } from '@/components/favoritos'
import { DatabaseSwitchOverlay } from '@/components/loader'
import { Navbar } from '@/components/navbar/Navbar'
import { DialogSearchProvider } from '@/components/search/context/dialogSearchContext'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, Tabs, TabsContent } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/zustand'

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
  const { schema, name } = useParams()
  const database = useAuthStore((state) => state.authContext?.database)
  const leftPanelRef = useRef<ImperativePanelHandle>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const loading = useUserTableStore((state) => state.loading)
  const object = useUserTableStore((state) => state.userTableObject)
  const fetchUserTableByName = useUserTableStore((state) => state.fetchUserTableByName)
  const error = useUserTableStore((state) => state.userTableError)
  const updateError = useUserTableStore((state) => state.updateUsertableError)

  useEffect(() => {
    if (!schema || !name) return

    const schemaName = decodeURIComponent(schema)
    const objectName = decodeURIComponent(name)
    if (object?.schemaName === schemaName && object.name === objectName) return

    fetchUserTableByName(schemaName, objectName)
  }, [fetchUserTableByName, name, object?.name, object?.schemaName, schema])

  useEffect(() => {
    if (!error) return
    toast.error('Error', { description: error.detail })
    updateError(null)
  }, [error, updateError])

  const handleHidePanel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!leftPanelRef.current) return

    const isCollapsedCurrent = leftPanelRef.current.isCollapsed()
    setIsCollapsed(!isCollapsedCurrent)

    if (isCollapsedCurrent) leftPanelRef.current.expand()
    else leftPanelRef.current.collapse()
  }

  return (
    <section className="bg-background flex h-full w-full flex-col">
      <Navbar />

      <main className="relative h-full w-full overflow-hidden">
        <section className="bg-background-paperchanel relative h-full w-full overflow-hidden">
          <FavoritoProvider type="U">
            <ResizablePanelGroup
              direction="horizontal"
              onLayout={(sizes) => {
                const [leftSize] = sizes
                setIsCollapsed(leftSize === 0)
              }}
            >
              {/* Sidebar izquierdo - full height */}
              <ResizablePanel
                minSize={isCollapsed ? 0 : 10}
                defaultSize={15}
                maxSize={15}
                className="transition-all"
                collapsible={true}
                collapsedSize={0}
                ref={leftPanelRef}
              >
                <DialogSearchProvider>
                  <UsertablePanelEditor />
                </DialogSearchProvider>
              </ResizablePanel>

              <ResizableHandle className={!isCollapsed ? 'pointer-events-none' : ''} withHandle={false} />

              {/* Panel derecho: headers + tabs content */}
              <ResizablePanel>
                <Tabs key={database} defaultValue={TabOption.Overview} className="flex h-full flex-col">
                  <HeaderUsertable />
                  <HeaderTabsUsertable />

                  {/* Tab Overview */}
                  <TabsContent value={TabOption.Overview} className="flex-1 overflow-auto">
                    {!object ? <UsertableEmptyState /> : <UsertableOverviewContent />}
                  </TabsContent>

                  {/* Tab Estructura */}
                  <TabsContent value={TabOption.Structure} className={cn('flex-1 overflow-auto', object && !loading && 'px-4 py-4')}>
                    {loading ? (
                      <div className="text-secondary flex h-full items-center justify-center text-sm">Cargando...</div>
                    ) : (
                      <DataTable columns={Columns} />
                    )}
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
              </ResizablePanel>
            </ResizablePanelGroup>

            {/* Botón para ocultar el panel */}
            {!isCollapsed ? (
              <button
                className="bg-background-neutral ring-border border-border hover:bg-action-hover absolute bottom-2 left-2 z-50 grid h-8 w-8 place-content-center rounded-sm border"
                onClick={handleHidePanel}
              >
                <ArrowLeftToLine size={18} className="text-primary" />
              </button>
            ) : (
              <button
                className="bg-background-neutral ring-border border-border hover:bg-action-hover absolute bottom-2 left-2 z-50 grid h-8 w-8 place-content-center rounded-sm border"
                onClick={handleHidePanel}
              >
                <ArrowRightToLine size={18} className="text-primary" />
              </button>
            )}
          </FavoritoProvider>
        </section>
        <DatabaseSwitchOverlay />
      </main>
    </section>
  )
}
