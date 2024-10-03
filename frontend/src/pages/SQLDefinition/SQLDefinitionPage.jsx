import { Code } from 'lucide-react'
import { useEffect } from 'react'
import { toast, Toaster } from 'sonner'

import { LoaderSlack } from '@/components/loader/LoaderSlack'
import { LinkObjectList } from '@/components/main/components/LinkObjectList'
import { useConfigStore, useEditorStore, useSQLDefinitionStore } from '@/stores'

import { DiffEditorCode } from './components/editor-code/DiffEditorCode'
import { EditorCode } from './components/editor-code/EditorCode'
import { Info } from './components/Info'
import { Options } from './components/options/Options'

export function SQLDefinitionPage() {
  const SQLDefinitionCode = useSQLDefinitionStore((state) => state.SQLDefinitionCode)
  const SQLDefinitionError = useSQLDefinitionStore((state) => state.SQLDefinitionError)
  const SQLDefinitionObjectList = useSQLDefinitionStore((state) => state.SQLDefinitionObjectList)
  const fetchSQLDefinition = useSQLDefinitionStore((state) => state.fetchSQLDefinition)
  const updateSQLDefinitionObject = useSQLDefinitionStore((state) => state.updateSQLDefinitionObject)
  const SQLDefinitionObject = useSQLDefinitionStore((state) => state.SQLDefinitionObject)
  const loading = useSQLDefinitionStore((state) => state.loading)
  const errorAligment = useSQLDefinitionStore((state) => state.errorAligment)
  const onDiffEditor = useEditorStore((state) => state.onDiffEditor)
  const isMaximized = useConfigStore((state) => state.isMaximized)

  useEffect(() => {
    if (SQLDefinitionError) toast.error('No se ha encontrado la definición del objeto')
  }, [SQLDefinitionError])

  useEffect(() => {
    if (errorAligment) toast.error('No se ha encontrado la definición de alineación, al parecer tu objeto es nuevo')
  }, [errorAligment])

  if (loading) return <LoaderSlack />

  return (
    <div
      className={`overflow-hidden rounded-md border border-owborder bg-owcard ${SQLDefinitionCode ? 'pb-10' : ''} ${isMaximized ? 'fixed left-0 top-0 z-50 h-screen w-screen' : ''}`}
    >
      {SQLDefinitionCode && (
        <div className="flex items-center justify-between gap-1 px-6 py-4">
          {!onDiffEditor ? (
            <h4 className="flex items-center gap-2 text-base font-bold text-zinc-300">
              <i>
                <Code size={20} />
              </i>
              {SQLDefinitionObject.name}
            </h4>
          ) : (
            <h3 className="max-w-sm text-sm text-zinc-200 sm:max-w-full">
              <span>Estas comparando con </span>
              <span className="font-bold text-emerald-500">PRODUCCIÓN</span>
              <span> (Actualizado al día de ayer)</span>
            </h3>
          )}

          <div className="flex gap-2">
            {/* Opciones */}
            <Options />
          </div>
        </div>
      )}

      {/* Monaco editor syntax */}
      {SQLDefinitionCode && (onDiffEditor ? <DiffEditorCode /> : <EditorCode />)}

      {!SQLDefinitionCode && (
        <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
          <h4 className="sm:4 pb-2 text-lg font-bold">Definición SQL de objetos</h4>

          {/* Multiples objetos */}
          {SQLDefinitionObjectList.length > 0 && (
            <LinkObjectList
              objectList={SQLDefinitionObjectList}
              updateObject={updateSQLDefinitionObject}
              fetchObjectAction={fetchSQLDefinition}
            />
          )}

          {/* Información sobre la página actual */}
          <Info />
        </div>
      )}

      <Toaster position="bottom-right" richColors />
    </div>
  )
}
