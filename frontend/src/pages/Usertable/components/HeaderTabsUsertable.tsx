import { CircleHelp, KeyRound, Rows3 } from 'lucide-react'

import { EditorTab } from '@/components/editor-header'
import { TabsList } from '@/components/ui'

import { TabOption } from '../constants/tab-options'
import { useUserTableStore } from '../store/usertable.store'

export function HeaderTabsUsertable() {
  const object = useUserTableStore((state) => state.userTableObject)

  return (
    <TabsList className="h-auto gap-1 rounded-none bg-transparent p-0">
      {/* Esquema nunca se deshabilita: es el tab por defecto y muestra el estado vacío */}
      <EditorTab value={TabOption.Structure} label="Esquema" icon={Rows3} />

      <EditorTab value={TabOption.Overview} label="Overview" icon={CircleHelp} disabled={!object} />

      <EditorTab value={TabOption.Indexes} label="Índices" icon={KeyRound} disabled={!object} />
    </TabsList>
  )
}
