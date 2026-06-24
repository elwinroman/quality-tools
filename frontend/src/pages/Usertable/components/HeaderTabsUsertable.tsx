import { LayoutDashboard, Rows3, TableProperties } from 'lucide-react'

import { TabsList, TabsTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'

import { TabOption } from '../constants/tab-options'
import { useUserTableStore } from '../store/usertable.store'

export function HeaderTabsUsertable() {
  const object = useUserTableStore((state) => state.userTableObject)

  return (
    <header className="border-b-border h-9 border-b px-2">
      <div className="SY flex h-full flex-nowrap items-center gap-2">
        <TabsList className="h-full gap-0 rounded-none">
          {/* Tab Esquema */}
          <TabsTrigger
            value={TabOption.Structure}
            disabled={!object}
            className={cn(
              // Base
              'h-full gap-1.5 rounded-none border-b-2 border-transparent',
              // Active
              'data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none',
            )}
          >
            <TableProperties size={12} />
            <span>Esquema</span>
          </TabsTrigger>

          {/* Tab Overview */}
          <TabsTrigger
            value={TabOption.Overview}
            className={cn(
              'h-full gap-1.5 rounded-none border-b-2 border-transparent',
              'data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none',
            )}
          >
            <LayoutDashboard size={12} />
            <span>Overview</span>
          </TabsTrigger>

          {/* Tab Índices */}
          <TabsTrigger
            value={TabOption.Indexes}
            disabled={!object}
            className={cn(
              // Base
              'h-full gap-1.5 rounded-none border-b-2 border-transparent',
              // Active
              'data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none',
            )}
          >
            <Rows3 size={12} />
            <span>Índices</span>
          </TabsTrigger>
        </TabsList>
      </div>
    </header>
  )
}
