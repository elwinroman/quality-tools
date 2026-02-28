import { ChevronRight, TriangleAlert } from 'lucide-react'

import { ConfigOptionEditor } from '@/components/editor-option'
import { useEditorOptionsStore } from '@/zustand'

import { useSysObjectStore } from '../../../store/sysobject.store'
import { NormalizeWhitespaceToggle } from './NormalizeWhitespaceToggle'
import { SideBySideToggle } from './SideBySideToggle'

export function HeaderDiffEditor() {
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const normalizeWhitespace = useEditorOptionsStore((state) => state.normalizeWhitespace)

  return (
    <header className="bg-background flex h-10 items-center justify-between px-4">
      {/* Breadcrumb */}
      {sysobject ? (
        <ul className="text-secondary SY flex items-center gap-0.5 text-[13px] font-medium">
          <li>{sysobject.schemaName}</li>
          <li>
            <ChevronRight size={14} className="place-self-center-safe" />
          </li>
          <li className="text-primary overflow-hidden">{sysobject.name}</li>
        </ul>
      ) : (
        <div className="SY flex h-11 items-center text-[13px]" />
      )}

      {/* Aviso normalización activa */}
      {normalizeWhitespace && (
        <div className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-amber-400/80">
          <TriangleAlert size={11} />
          <span>Vista modificada · whitespace normalizado</span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-1">
        <NormalizeWhitespaceToggle />
        <SideBySideToggle />
        <ConfigOptionEditor />
      </div>
    </header>
  )
}
