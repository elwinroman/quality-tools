import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'
import { toast } from 'sonner'

import { FavoritoProvider } from '@/components/favoritos'
import { DatabaseSwitchOverlay } from '@/components/loader'
import { Navbar } from '@/components/navbar/Navbar'
import { DialogSearchProvider } from '@/components/search/context/dialogSearchContext'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, Tabs, TabsContent } from '@/components/ui'
import { useAuthStore } from '@/zustand'

import { EditorCode, HeaderEditor, HeaderTabs, OverviewContent, PanelEditor } from './components'
import { DiffScriptContent } from './components/diff-script-content/DiffScriptContent'
import { TabOption } from './constants/tabs-options'
import { useSysObjectStore } from './store/sysobject.store'

export function SQLDefinitionPage() {
  const database = useAuthStore((state) => state.authContext?.database)
  const leftPanelRef = useRef<ImperativePanelHandle>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState(TabOption.Script)
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const error = useSysObjectStore((state) => state.errorObject)
  const updateError = useSysObjectStore((state) => state.updateErrorObject)

  useEffect(() => {
    if (!error) return
    toast.error('Error', { description: error.detail })
    updateError(null)
  }, [error, updateError])

  useEffect(() => {
    setActiveTab((currentTab) => (currentTab === TabOption.Compare ? TabOption.Script : currentTab))
  }, [database])

  useEffect(() => {
    if (!sysobject) return
    setActiveTab((currentTab) => (currentTab === TabOption.Compare ? TabOption.Script : currentTab))
  }, [sysobject])

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
          <FavoritoProvider type="ALL_EXCEPT_USERTABLE">
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
                  <PanelEditor />
                </DialogSearchProvider>
              </ResizablePanel>

              <ResizableHandle className={!isCollapsed ? 'pointer-events-none' : ''} withHandle={false} />

              {/* Panel derecho: headers + editor */}
              <ResizablePanel>
                <Tabs key={database} value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
                  <HeaderEditor activeTab={activeTab} />
                  <HeaderTabs />

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
