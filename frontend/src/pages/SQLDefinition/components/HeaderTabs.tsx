import { FileCode, GitBranch, GitCompareArrows, LayoutDashboard } from 'lucide-react'

import { EditorTab } from '@/components/editor-header'
import { TabsList } from '@/components/ui'

import { TabOption } from '../constants/tabs-options'
import { useSysObjectStore } from '../store/sysobject.store'

export function HeaderTabs() {
  const sysobject = useSysObjectStore((state) => state.sysobject)

  return (
    <TabsList className="h-auto gap-1 rounded-none bg-transparent p-0">
      <EditorTab value={TabOption.Script} label="Script" icon={FileCode} />

      <EditorTab value={TabOption.Overview} label="Overview" icon={LayoutDashboard} disabled={!sysobject} />

      <EditorTab value={TabOption.Dependencies} label="Relaciones" icon={GitBranch} disabled={!sysobject} />

      <EditorTab value={TabOption.Compare} label="Comparar" icon={GitCompareArrows} disabled={!sysobject} />
    </TabsList>
  )
}
