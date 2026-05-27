import { isAxiosError } from 'axios'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ExtendedProperty, UserTableColumn, UserTableForeignKey, UserTableIndex, UserTableObject } from '../models/usertable.model'
import { getUserTableByNameService } from '../services/usertable.service'

interface UserTableError {
  title: string
  detail: string
}

interface UserTableState {
  /** Metadatos del objeto usertable seleccionado */
  userTableObject: UserTableObject | null

  /** Listas de datos de la tabla */
  userTableColumnList: UserTableColumn[]
  userTableExtendedPropertieList: ExtendedProperty[]
  userTableIndexList: UserTableIndex[]
  userTableForeignKeyList: UserTableForeignKey[]

  /** Estado de carga y error */
  loading: boolean
  userTableError: UserTableError | null

  /** Acciones */
  fetchUserTableByName(schema: string, name: string): Promise<void>
  updateUsertableError(error: UserTableError | null): void
  reset(): void
}

const initialTableData = {
  userTableColumnList: [] as UserTableColumn[],
  userTableExtendedPropertieList: [] as ExtendedProperty[],
  userTableIndexList: [] as UserTableIndex[],
  userTableForeignKeyList: [] as UserTableForeignKey[],
}

export const useUserTableStore = create<UserTableState>()(
  persist(
    (set) => ({
      userTableObject: null,
      ...initialTableData,
      loading: false,
      userTableError: null,

      updateUsertableError: (error) => {
        set({ userTableError: error })
      },

      fetchUserTableByName: async (schema: string, name: string) => {
        set({ loading: true })

        try {
          const { call } = getUserTableByNameService(schema, name)
          const response = await call
          const { data } = response.data

          set({
            ...initialTableData,
            userTableObject: {
              id: data.id,
              name: data.name,
              type: data.type,
              typeDesc: data.typeDesc,
              schemaName: data.schemaName,
              createDate: data.createDate,
              modifyDate: data.modifyDate,
            },
            userTableExtendedPropertieList: data.extendedProperties,
            userTableColumnList: data.columns,
            userTableIndexList: data.indexes,
            userTableForeignKeyList: data.foreignKeys,
          })
        } catch (err) {
          if (isAxiosError(err) && err.response) {
            const { data } = err.response
            set({
              ...initialTableData,
              userTableError: {
                title: data.error?.title ?? 'Error al obtener la tabla',
                detail: data.error?.detail ?? 'Error desconocido',
              },
            })
          } else {
            set({
              ...initialTableData,
              userTableError: {
                title: 'Error de red',
                detail: 'No se pudo conectar al servidor o el servidor no está disponible.',
              },
            })
          }
        } finally {
          set({ loading: false })
        }
      },

      reset: () => {
        set({
          userTableObject: null,
          ...initialTableData,
          userTableError: null,
          loading: false,
        })
      },
    }),
    {
      name: 'app.usertable.session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => Object.fromEntries(Object.entries(state).filter(([key]) => !['userTableError', 'loading'].includes(key))),
    },
  ),
)
