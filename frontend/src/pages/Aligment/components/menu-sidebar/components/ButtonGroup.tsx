import { useSearchContext } from '@aligment/hooks'
import { useAligmentStore } from '@aligment/zustand/aligment.store'
import { MouseEvent } from 'react'

import { Button } from '@/components/ui'
import { TypeViews } from '@/models/sysobject'

export function ButtonGroup() {
  const createSysObject = useAligmentStore((state) => state.createSysObject)
  const updateViewMode = useAligmentStore((state) => state.updateViewMode)
  const { loading, updateSearch, getObject } = useSearchContext()

  // Maneja el evento click para limpiar
  const handleClickLimpiar = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    updateSearch('')
    createSysObject(null)
    updateViewMode(TypeViews.FullView)
  }

  // Maneja el evento click para buscar el objeto
  const handleClickConsultar = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    await getObject()
  }

  return (
    <section className="flex w-full items-center gap-1.5">
      <Button variant="default" size="xs" className="h-7 flex-1 px-3" onClick={handleClickConsultar} disabled={loading}>
        <span>Consultar</span>
      </Button>

      <Button variant="ghost" size="xs" className="h-7 shrink-0 px-3" onClick={handleClickLimpiar} disabled={loading}>
        <span>Limpiar</span>
      </Button>
    </section>
  )
}
