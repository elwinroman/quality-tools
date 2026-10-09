import { HeaderSidebarToggle, ObjectEditorHeader, ObjectName, RefreshObjectButton } from '@/components/editor-header'
import { FavoritoToggle } from '@/components/favoritos'
import { SearchTrigger } from '@/components/search/components/SearchTrigger'

import { useUserTableStore } from '../store/usertable.store'
import { HeaderTabsUsertable } from './HeaderTabsUsertable'

interface Props {
  onOpenSidebar?: () => void
}

export function HeaderUsertable({ onOpenSidebar }: Props) {
  const object = useUserTableStore((state) => state.userTableObject)
  const loading = useUserTableStore((state) => state.loading)
  const fetchUserTableByName = useUserTableStore((state) => state.fetchUserTableByName)

  const hasObject = !!object?.name

  const handleRefresh = () => {
    if (!object || loading) return

    fetchUserTableByName(object.schemaName, object.name)
  }

  return (
    <ObjectEditorHeader
      left={
        <div className="flex min-w-0 items-center gap-2 max-lg:min-w-max">
          {onOpenSidebar && <HeaderSidebarToggle onClick={onOpenSidebar} />}

          {hasObject ? (
            <div className="flex min-w-0 items-center gap-1">
              <FavoritoToggle object={{ schemaName: object.schemaName, name: object.name, type: object.type }} />

              <ObjectName schemaName={object.schemaName} name={object.name} />
            </div>
          ) : (
            <div className="SY flex h-11 items-center text-[13px]"></div>
          )}

          <HeaderTabsUsertable />
        </div>
      }
      actions={
        <div className="flex items-center gap-5 max-lg:shrink-0">
          <SearchTrigger />

          <div className="flex items-center gap-1">
            <RefreshObjectButton onClick={handleRefresh} disabled={!object || loading} label="Refrescar tabla" />
          </div>
        </div>
      }
    />
  )
}
