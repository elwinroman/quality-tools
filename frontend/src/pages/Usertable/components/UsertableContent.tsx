import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'
import { toast } from 'sonner'

import { FavoritoProvider } from '@/components/favoritos'
import { DialogSearchProvider } from '@/components/search/context/dialogSearchContext'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/zustand'

import { TabOption } from '../constants/tab-options'
import { useUserTableStore } from '../store/usertable.store'
import { Columns } from './Columns'
import { DataTable } from './DataTable'
import { HeaderTabsUsertable } from './HeaderTabsUsertable'
import { HeaderUsertable } from './HeaderUsertable'
import { IndexColumns } from './IndexColumns'
import { IndexDataTable } from './IndexDataTable'
import { UsertableEmptyState } from './UsertableEmptyState'
import { UsertablePanelEditor } from './UsertablePanelEditor'

export function UsertableContent() {
  const leftPanelRef = useRef<ImperativePanelHandle>(null)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const database = useAuthStore((state) => state.authContext?.database)
  const loading = useUserTableStore((state) => state.loading)
  const object = useUserTableStore((state) => state.userTableObject)
  const error = useUserTableStore((state) => state.userTableError)
  const updateError = useUserTableStore((state) => state.updateUsertableError)

  useEffect(() => {
    if (!error) return
    toast.error('Error', { description: error.detail })
    updateError(null)
  }, [error, updateError])

  const handleHidePanel = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!leftPanelRef.current) return

    const isCollapsedCurrent = leftPanelRef.current.isCollapsed()
    setIsCollapsed(!isCollapsedCurrent)

    if (isCollapsedCurrent) leftPanelRef.current.expand()
    else leftPanelRef.current.collapse()
  }, [])

  return (
    <FavoritoProvider type="U">
      <Tabs key={database} defaultValue={TabOption.Structure} className="relative flex h-full w-full flex-col">
        <HeaderTabsUsertable />

        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes) => {
            const [leftSize] = sizes
            setIsCollapsed(leftSize === 0)
          }}
        >
          {/* Panel izquierdo */}
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

          {/* Separador */}
          <ResizableHandle className={!isCollapsed ? 'pointer-events-none' : ''} withHandle={false} />

          {/* Panel derecho: header + tabs content */}
          <ResizablePanel>
            <HeaderUsertable />

            {/* Tab Estructura */}
            <TabsContent
              value={TabOption.Structure}
              className={cn('h-[calc(100%-2.5rem)] w-full overflow-auto', object && !loading && 'px-4 py-4')}
            >
              {loading ? (
                <div className="text-secondary flex h-full items-center justify-center text-sm">Cargando...</div>
              ) : !object ? (
                <UsertableEmptyState />
              ) : (
                <DataTable columns={Columns} />
              )}
            </TabsContent>

            {/* Tab Índices */}
            <TabsContent value={TabOption.Indexes} className="h-[calc(100%-2.5rem)] w-full overflow-auto px-4 py-4">
              {loading ? (
                <div className="text-secondary flex h-full items-center justify-center text-sm">Cargando...</div>
              ) : (
                <IndexDataTable columns={IndexColumns} />
              )}
            </TabsContent>
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
      </Tabs>
    </FavoritoProvider>
  )
}
