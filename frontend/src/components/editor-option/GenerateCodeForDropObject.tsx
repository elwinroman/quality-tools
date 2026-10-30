import Editor from '@monaco-editor/react'
import { BrushCleaning } from 'lucide-react'
import { useMemo } from 'react'

import { ThemedCircleLoader } from '@/components/loader'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui'
import { BaseMonacoEditorOptions, resolveEditorThemePreference, TypeSysObjects } from '@/constants'
import { useEditorTheme } from '@/constants/monaco-themes/use-editor-theme'
import { useAppStore, useEditorOptionsStore } from '@/zustand'

import { CopyCode } from './CopyCode'

/**
 * Palabra clave de `DROP` por tipo de `sys.objects`.
 *
 * El tipo es tambien el valor que espera `OBJECT_ID`, asi que no hace falta
 * duplicarlo en una segunda columna: la clave alcanza para las dos cosas.
 */
const DROP_KEYWORD_BY_TYPE: Record<string, string> = {
  P: 'DROP PROCEDURE',
  V: 'DROP VIEW',
  TF: 'DROP FUNCTION',
  FN: 'DROP FUNCTION',
  TR: 'DROP TRIGGER',
  U: 'DROP TABLE',
}

/** Descripcion legible por tipo, tomada de la misma fuente que usa el resto de la app. */
const TYPE_DESCRIPTION_BY_TYPE: Record<string, string> = Object.fromEntries(
  Object.values(TypeSysObjects).map((entry) => [entry.type, entry.description]),
)

/**
 * Genera el script que elimina el objeto y deja preparadas las opciones de
 * creacion estandar, para poder recrearlo con los mismos criterios.
 *
 * Los `SET` van despues del `DROP` a proposito: son el preambulo del `CREATE`
 * que el usuario pega debajo, no parte de la eliminacion.
 */
function generateDropSQL(schema: string, name: string, type: string): string {
  const keyword = DROP_KEYWORD_BY_TYPE[type]
  if (!keyword) return `-- Tipo de objeto no soportado: ${type}`

  const qualifiedName = `[${schema}].[${name}]`

  return [
    `IF OBJECT_ID(N'${qualifiedName}', N'${type}') IS NOT NULL`,
    `    ${keyword} ${qualifiedName}`,
    `GO`,
    ``,
    `SET ANSI_NULLS ON`,
    `GO`,
    ``,
    `SET QUOTED_IDENTIFIER ON`,
    `GO`,
  ].join('\n')
}

/** Padding vertical del editor, en px. La altura del bloque se calcula con este valor. */
const DROP_EDITOR_PADDING_Y = 12

/**
 * Vista del script: sin minimapa, sin numeros de linea y sin adornos.
 * Hereda de `BaseMonacoEditorOptions` el `readOnly`, la tipografia y las ligaduras,
 * asi que el codigo se ve igual que en el editor principal.
 */
const DROP_EDITOR_OPTIONS = {
  ...BaseMonacoEditorOptions,
  minimap: { enabled: false },
  lineNumbers: 'off',
  folding: false,
  renderLineHighlight: 'none',
  overviewRulerLanes: 0,
  scrollBeyondLastLine: false,
  padding: { top: DROP_EDITOR_PADDING_Y, bottom: DROP_EDITOR_PADDING_Y },
} as const

interface Props {
  object: {
    schema: string
    name: string
    type: string
  }
  className?: string
  disabled?: boolean
}

export function GenerateCodeForDropObject({ object, className = '', disabled = false }: Props) {
  const isDark = useAppStore((state) => state.isDark)
  const { fontSize, theme, themeMode, lightTheme, darkTheme } = useEditorOptionsStore((state) => state)

  const codeString = generateDropSQL(object.schema, object.name, object.type)
  const typeDescription = TYPE_DESCRIPTION_BY_TYPE[object.type]

  // Mismo tema que el editor principal, resuelto igual: la vista sigue la
  // preferencia del usuario sin exponer un selector propio.
  const effectiveTheme = resolveEditorThemePreference({ theme, themeMode, lightTheme, darkTheme }, isDark)
  const { handleBeforeMount } = useEditorTheme(effectiveTheme)

  // El bloque se ajusta a su contenido: sin alto fijo y sin scroll vertical. El
  // `lineHeight` se fija explicito para que la cuenta coincida exactamente con lo
  // que dibuja Monaco, y sigue escalando si el usuario cambia el tamano de fuente.
  const lineHeight = Math.round(fontSize * 1.5)
  const lineCount = codeString.split('\n').length
  const editorHeight = lineCount * lineHeight + DROP_EDITOR_PADDING_Y * 2

  const editorOptions = useMemo(
    () => ({ ...DROP_EDITOR_OPTIONS, lineHeight, scrollbar: { vertical: 'hidden' as const, horizontal: 'auto' as const } }),
    [lineHeight],
  )

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <DialogTrigger asChild>
            <TooltipTrigger asChild>
              {/* El icono no es un tacho a proposito: no borra nada, genera un script. */}
              <button
                className={`group not-disabled:hover:bg-action-hover h-7 rounded-sm px-2 ${className}`}
                disabled={disabled}
                aria-label="Generar script de eliminación"
              >
                <BrushCleaning size={14} className="group-hover:text-secondary group-disabled:text-disabled text-primary" />
              </button>
            </TooltipTrigger>
          </DialogTrigger>

          <TooltipContent side="bottom">
            <p>Script para eliminar el objeto</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Script de eliminación</DialogTitle>
          <DialogDescription>Elimina el objeto para volver a crearlo con las opciones estándar.</DialogDescription>
        </DialogHeader>

        {/* Identidad del objeto: es el contexto de la accion, por eso no va en el titulo. */}
        <div className="border-border bg-background-neutral flex items-center justify-between gap-3 rounded-sm border px-3 py-2">
          <span className="text-primary truncate font-mono text-xs">
            [{object.schema}].[{object.name}]
          </span>
          {typeDescription && <span className="text-secondary shrink-0 text-[0.6875rem]">{typeDescription}</span>}
        </div>

        <div className="border-border overflow-hidden rounded-sm border">
          {/* Misma barra de codigo que los paneles del diff: etiqueta a la izquierda, copiar a la derecha. */}
          <div className="bg-background-neutral flex items-center justify-between gap-2 py-0 pr-1 pl-3">
            <span className="text-secondary text-[0.6875rem] font-medium tracking-wide">SQL</span>
            <CopyCode text={codeString} />
          </div>

          <div style={{ height: editorHeight }}>
            <Editor
              beforeMount={handleBeforeMount}
              language="sql"
              theme={effectiveTheme}
              value={codeString}
              options={editorOptions}
              loading={<ThemedCircleLoader />}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
