import { Table } from 'lucide-react'

import { AlertMessages } from '@/components/alert-messages/AlertMessages'
import { LinkObjectList } from '@/components/main/components/LinkObjectList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserTableStore } from '@/stores/usertable.store'

import { TableDescription } from './components'

export function DescriptionPage() {
  const userTableObject = useUserTableStore((state) => state.userTableObject)
  const userTableColumnList = useUserTableStore(
    (state) => state.userTableColumnList,
  )
  const userTableError = useUserTableStore((state) => state.userTableError)
  const userTableObjectList = useUserTableStore(
    (state) => state.userTableObjectList,
  )
  const fetchUserTable = useUserTableStore((state) => state.fetchUserTable)
  const updateObjectUserTable = useUserTableStore(
    (state) => state.updateObjectUserTable,
  )
  const loading = useUserTableStore((state) => state.loading)

  if (loading) return <div>Buscando...</div>

  return (
    <div className="flex flex-col gap-2 rounded-md border border-ownavbar bg-owcard px-8 py-8">
      <h4 className="flex items-center gap-2 pb-2 text-base font-bold text-zinc-300">
        <i>
          <Table size={20} />
        </i>
        <span>{userTableObject.name}</span>
      </h4>

      {/* Alerta de error */}
      {userTableError && (
        <AlertMessages message={userTableError} type="error" />
      )}

      {/* Multiples objetos */}
      {userTableObjectList.length > 0 && (
        <LinkObjectList
          objectList={userTableObjectList}
          updateObject={updateObjectUserTable}
          fetchObjectAction={fetchUserTable}
        />
      )}

      <Tabs defaultValue="description">
        <TabsList>
          <TabsTrigger value="description">Descripción</TabsTrigger>
          <TabsTrigger value="relationship-diagram-flow">
            Diagrama de relaciones de la tabla
          </TabsTrigger>
        </TabsList>

        {/* Descripción del usertable */}
        <TabsContent value="description">
          {userTableColumnList && <TableDescription />}
        </TabsContent>

        {/* Diagrama de las relaciones del usertable */}
        {/* <TabsContent value="relationship-diagram-flow">
          <RelationshipDiagramFlow />
        </TabsContent> */}
      </Tabs>
    </div>
  )
}
