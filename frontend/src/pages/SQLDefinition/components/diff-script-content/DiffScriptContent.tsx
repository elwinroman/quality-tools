import { useEffect } from 'react'

import { useSysObjectStore } from '../../store/sysobject.store'
import { DiffEditorCode } from './components/DiffEditorCode'

export function DiffScriptContent() {
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const fetchProdSysObject = useSysObjectStore((state) => state.fetchProdSysObject)

  // busca el objeto de producción cuando cambia el sysobject
  // el store internamente evita llamadas duplicadas
  useEffect(() => {
    if (sysobject) fetchProdSysObject()
  }, [sysobject])

  return <DiffEditorCode />
}
