import { FileCode, GitCompareArrows, Info } from 'lucide-react'

import { TabsList, TabsTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'

import { TabOption } from '../constants/tabs-options'
import { useSysObjectStore } from '../store/sysobject.store'

export function HeaderTabs() {
  const sysobject = useSysObjectStore((state) => state.sysobject)

  return (
    <header className="border-b-border h-9 border-b px-2">
      <div className="SY flex h-full flex-nowrap items-center gap-2">
        <TabsList className="h-full gap-0 rounded-none">
          {/* Tab Script */}
          <TabsTrigger
            value={TabOption.Script}
            className={cn(
              // Base
              'h-full gap-1.5 rounded-none border-b-2 border-transparent',
              // Active
              'data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none',
            )}
          >
            <FileCode size={12} />
            <span>Script</span>
          </TabsTrigger>

          {/* Tab Overview */}
          <TabsTrigger
            value={TabOption.Overview}
            disabled={!sysobject}
            className={cn(
              // Base
              'h-full gap-1.5 rounded-none border-b-2 border-transparent',
              // Active
              'data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none',
            )}
          >
            <Info size={12} />
            <span>Overview</span>
          </TabsTrigger>

          {/* Tab Comparar */}
          <TabsTrigger
            value={TabOption.Compare}
            disabled={!sysobject}
            className={cn(
              // Base
              'h-full gap-1.5 rounded-none border-b-2 border-transparent',
              // Light
              'text-pink-800',
              // Dark
              'dark:text-pink-800',
              // Hover
              'hover:text-pink-600',
              // Dark hover
              'dark:hover:text-pink-600',
              // Active
              'data-[state=active]:border-pink-600 data-[state=active]:bg-transparent data-[state=active]:!text-pink-600 data-[state=active]:shadow-none',
            )}
          >
            <GitCompareArrows size={12} />
            <span>Comparar</span>
          </TabsTrigger>
        </TabsList>
      </div>
    </header>
  )
}
