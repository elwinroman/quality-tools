import { History, X } from 'lucide-react'

import { useAuthStore } from '@/zustand'

import { BusquedaReciente } from '../../../models'
import { CardWrapper } from './CardWrapper'
import { Item } from './Item'

interface Props {
  recents: BusquedaReciente[]
  updateOpen(state: boolean): void
  onDelete(id: string): void
}

export function Recents({ recents, updateOpen, onDelete }: Props) {
  const authContext = useAuthStore((state) => state.authContext)

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation()
    onDelete(id)
  }

  const limitedRecents = recents.slice(0, 10)

  return (
    <CardWrapper title={`Búsquedas recientes para '${authContext?.database}'`}>
      {limitedRecents.map((data) => (
        <div key={data.objectId} className="group/recent relative">
          <Item objectId={data.objectId} schema={data.schema} objectName={data.objectName} updateOpen={updateOpen}>
            <History size={14} className="text-primary/90 mt-0.5" />
            <div className="text-primary/90 flex w-full items-center justify-between gap-1 transition-colors">
              <span className="overflow-hidden">{data.objectName}</span>
            </div>
          </Item>
          <button
            type="button"
            title="Eliminar búsqueda reciente"
            className="text-primary/90 hover:text-danger absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer opacity-0 transition-opacity group-hover/recent:opacity-100"
            onClick={(e) => handleDelete(e, data.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </CardWrapper>
  )
}
