import { ConfigOptionEditor, CopyCode, GenerateCodeForDropObject } from '@/components/editor-option'
import { ViewModeSelect } from '@/components/view-mode-select'
import { cn } from '@/lib/utils'
import { ViewMode } from '@/models/sysobject'

interface Props {
  /** Objeto sobre el que operan copiar y generar el DROP. */
  object: { schema: string; name: string; type: string }
  /** Código actual del editor, para copiar. */
  code: string
  viewMode: ViewMode
  onViewModeChange(value: ViewMode): void
  /** Generar DROP y copiar. Se oculta mientras se comparan dos scripts. */
  showObjectActions?: boolean
  /** El selector de vista sólo aplica a los tabs que muestran código. */
  showViewMode?: boolean
  className?: string
}

/**
 * Acciones del header del editor: generar el DROP, copiar, configurar el editor
 * y elegir la vista del código.
 */
export function EditorOptions({
  object,
  code,
  viewMode,
  onViewModeChange,
  showObjectActions = true,
  showViewMode = true,
  className,
}: Props) {
  const disabled = !object.name

  return (
    <div className={cn('flex flex-nowrap items-center gap-1', className)}>
      {showObjectActions && (
        <>
          <GenerateCodeForDropObject object={object} disabled={disabled} />
          <CopyCode text={code} disabled={disabled} />
        </>
      )}

      <ConfigOptionEditor />

      {showViewMode && <ViewModeSelect value={viewMode} onChange={onViewModeChange} />}
    </div>
  )
}
