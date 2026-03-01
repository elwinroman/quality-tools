import { ConfigOptionEditor, GenerateCodeForDropObject } from '@/components/editor-option'
import { CopyCode } from '@/components/editor-option'

import { useAligmentStore } from '../zustand/aligment.store'

interface Props {
  className?: string
}

export function EditorAligmentOption({ className = '' }: Props) {
  const sysobject = useAligmentStore((state) => state.sysobject) ?? {
    schemaId: '',
    name: '',
    type: '',
    definition: '',
    schemaName: '',
  }
  const currentEditorCode = useAligmentStore((state) => state.currentEditorCode)

  return (
    <section className={className}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end sm:gap-x-5 sm:gap-y-4">
        <div className="flex flex-nowrap items-center gap-2">
          <GenerateCodeForDropObject
            object={{ schema: sysobject.schemaName, name: sysobject.name, type: sysobject.type }}
            disabled={!sysobject.name}
          />
          <ConfigOptionEditor /> {/* Configuración del editor */}
          {/* <DownloadScript text={sysobject.definition} disabled={!sysobject.definition} filename={sysobject.name} /> */}
          <CopyCode text={currentEditorCode} />
        </div>
      </div>
    </section>
  )
}
