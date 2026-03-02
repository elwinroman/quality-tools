import { Dialog } from '@radix-ui/react-dialog'
import { BrushCleaning } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

import {
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
import { useAppStore } from '@/zustand/app.store'

const DROP_KEYWORD_MAP: Record<string, { keyword: string; objectType: string }> = {
  P: { keyword: 'DROP PROCEDURE', objectType: 'P' },
  V: { keyword: 'DROP VIEW', objectType: 'V' },
  TF: { keyword: 'DROP FUNCTION', objectType: 'TF' },
  FN: { keyword: 'DROP FUNCTION', objectType: 'FN' },
  TR: { keyword: 'DROP TRIGGER', objectType: 'TR' },
  U: { keyword: 'DROP TABLE', objectType: 'U' },
}

function generateDropSQL(schema: string, name: string, type: string): string {
  const mapping = DROP_KEYWORD_MAP[type]
  if (!mapping) return `-- Tipo de objeto no soportado: ${type}`

  return [
    `IF OBJECT_ID(N'[${schema}].[${name}]', N'${mapping.objectType}') IS NOT NULL`,
    `\t${mapping.keyword} [${schema}].[${name}]`,
    `GO`,
    ``,
    `SET ANSI_NULLS ON`,
    `GO`,
    ``,
    `SET QUOTED_IDENTIFIER ON`,
    `GO`,
  ].join('\n')
}

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
  const isDark = useAppStore((s) => s.isDark)

  const codeString = generateDropSQL(object.schema, object.name, object.type)

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <DialogTrigger asChild>
            <TooltipTrigger asChild>
              <button className={`group h-7 rounded-sm px-2 not-disabled:hover:bg-white/[0.08] ${className}`} disabled={disabled}>
                <BrushCleaning size={14} className="group-hover:text-secondary group-disabled:text-disabled text-primary" />
              </button>
            </TooltipTrigger>
          </DialogTrigger>

          <TooltipContent side="bottom">
            <p>Generar código para dropear el objeto</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="w-auto max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>
            Drop: {object.schema}.{object.name}
          </DialogTitle>
          <DialogDescription>Script generado para eliminar el objeto de la base de datos.</DialogDescription>
        </DialogHeader>

        <div className="bg-background-neutral max-h-[400px] overflow-auto rounded-sm">
          <SyntaxHighlighter
            language="sql"
            style={isDark ? oneDark : oneLight}
            showLineNumbers={false}
            customStyle={{
              margin: 0,
              padding: '16px',
              fontSize: '13px',
              lineHeight: '1.5',
              fontFamily: '"Fira Code Variable", "Cascadia Code", "JetBrains Mono", monospace',
              fontVariantLigatures: 'normal',
              fontFeatureSettings: '"calt" 1, "liga" 1, "dlig" 1',
              textRendering: 'optimizeLegibility',
              background: 'transparent',
              overflow: 'visible',
              minWidth: 'min-content',
            }}
            codeTagProps={{
              style: {
                fontFamily: '"Fira Code Variable", monospace',
                fontVariantLigatures: 'common-ligatures',
                fontFeatureSettings: '"liga" on, "calt" on',
                display: 'block',
                overflowX: 'auto',
              },
            }}
            wrapLongLines={false}
            PreTag="div"
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
