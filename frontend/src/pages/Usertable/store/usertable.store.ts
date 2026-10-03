import { isAxiosError } from 'axios'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { SysObjectRelation } from '@/models/sysobject'
import { getSysObjectDependenciesService, getSysObjectDependentsService } from '@/services'

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

  /** Objetos que la tabla actual usa. */
  dependencies: SysObjectRelation[]

  /** Objetos que usan a la tabla actual. */
  dependents: SysObjectRelation[]

  /** Indica si se estan cargando dependencias y dependientes. */
  isLoadingRelations: boolean

  /** Error al obtener dependencias o dependientes. */
  errorRelations: UserTableError | null

  /** Estado de carga y error */
  loading: boolean
  userTableError: UserTableError | null

  /** Acciones */
  fetchUserTableByName(schema: string, name: string): Promise<void>
  fetchUserTableRelations(): Promise<void>
  updateUsertableError(error: UserTableError | null): void
  reset(): void
}

const initialTableData = {
  userTableColumnList: [] as UserTableColumn[],
  userTableExtendedPropertieList: [] as ExtendedProperty[],
  userTableIndexList: [] as UserTableIndex[],
  userTableForeignKeyList: [] as UserTableForeignKey[],
}

/** Relaciones keyed a la tabla seleccionada; se limpian al cambiar de tabla y no se persisten. */
const initialRelationData = {
  dependencies: [] as SysObjectRelation[],
  dependents: [] as SysObjectRelation[],
  isLoadingRelations: false,
  errorRelations: null as UserTableError | null,
}

export const useUserTableStore = create<UserTableState>()(
  persist(
    (set, get) => ({
      userTableObject: null,
      ...initialTableData,
      ...initialRelationData,
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
            ...initialRelationData,
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
              ...initialRelationData,
              userTableError: {
                title: data.error?.title ?? 'Error al obtener la tabla',
                detail: data.error?.detail ?? 'Error desconocido',
              },
            })
          } else {
            set({
              ...initialTableData,
              ...initialRelationData,
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

      fetchUserTableRelations: async () => {
        const { userTableObject, dependencies, dependents, errorRelations } = get()
        if (!userTableObject) return

        // si ya hay resultado (éxito o error), no repetir la llamada
        if (dependencies.length > 0 || dependents.length > 0 || errorRelations) return

        set({ isLoadingRelations: true })
        try {
          const dependenciesCall = getSysObjectDependenciesService(userTableObject.schemaName, userTableObject.name)
          const dependentsCall = getSysObjectDependentsService(userTableObject.schemaName, userTableObject.name)

          const [dependenciesResponse, dependentsResponse] = await Promise.all([dependenciesCall.call, dependentsCall.call])

          set({
            dependencies: dependenciesResponse.data,
            dependents: dependentsResponse.data,
            errorRelations: null,
          })
        } catch (err) {
          if (isAxiosError(err) && err.response) {
            const { data } = err.response
            set({
              errorRelations: {
                title: data.error?.title ?? 'Error al obtener relaciones',
                detail: data.error?.detail ?? 'Error desconocido',
              },
            })
          } else {
            set({
              errorRelations: {
                title: 'Error de red',
                detail: 'No se pudo conectar al servidor o el servidor no está disponible.',
              },
            })
          }
        } finally {
          set({ isLoadingRelations: false })
        }
      },

      reset: () => {
        set({
          userTableObject: null,
          ...initialTableData,
          ...initialRelationData,
          userTableError: null,
          loading: false,
        })
      },
    }),
    {
      name: 'app.usertable.session',
      storage: createJSONStorage(() => sessionStorage),
      // Las relaciones y los estados efimeros no se persisten en sessionStorage.
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !['userTableError', 'loading', 'dependencies', 'dependents', 'isLoadingRelations', 'errorRelations'].includes(key),
          ),
        ),
    },
  ),
)
