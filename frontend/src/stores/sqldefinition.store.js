import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { AligmentObjectInitialState, ObjectInitialState, SQLDefinitionInitialState } from '@/models/object.model'
import { findSQLDefinitionObject, getSQLDefinitionAligmentObject, getSQLDefinitionObject } from '@/services'
import { useEditorStore } from '@/stores'

export const useSQLDefinitionStore = create(
  persist(
    (set, get) => ({
      loading: false, // indica si se está cargando la definición
      loadingAligment: false, // indica si se está cargando la definición de alineación
      errorAligment: null, // indica si hubo un error al obtener la definición de alineación
      updateErrorAligment: ({ state }) => {
        set({ errorAligment: state })
      },
      SQLDefinitionError: null, // error al obtener la definición
      updateSQLDefinitionError: ({ state }) => {
        set({ SQLDefinitionError: state })
      },

      hasAligmentObject: true, // indica si existe un objeto de alineación

      // definición de objetos
      SQLDefinitionObject: { ...ObjectInitialState },
      SQLDefinitionAligmentObject: { ...AligmentObjectInitialState },
      ...SQLDefinitionInitialState,

      // obtiene el objeto de definición de pre-producción
      getSQLDefinitionAligmentObject: async () => {
        const updateDiffEditor = useEditorStore.getState().updateDiffEditor
        const { schemaId, name } = get().SQLDefinitionObject
        set({ loadingAligment: true })

        const res = await getSQLDefinitionAligmentObject({ name, schemaId })

        if (res.status === 'error') {
          set({ loadingAligment: false })
          set({
            errorAligment: {
              statusCode: res.statusCode,
              message: res.message,
              originalError: res.originalError,
            },
          })
          if (res.statusCode === 404) set({ hasAligmentObject: false })

          updateDiffEditor(false)
          return
        }

        set({ SQLDefinitionAligmentObject: { ...res.data } })
        set({ loadingAligment: false })
        set({ errorAligment: null })
        set({ SQLDefinitionError: null })
      },

      // updatea el objecto de definición cuando existen coincidencias
      updateSQLDefinitionObject: ({ object }) => {
        set({ SQLDefinitionObject: object })
      },

      searchSQLDefinitionObject: async ({ name }) => {
        const updateDiffEditor = useEditorStore.getState().updateDiffEditor
        set({ loading: true })
        set({ hasAligmentObject: true })
        set({ errorAligment: null })
        updateDiffEditor(false)

        const res = await findSQLDefinitionObject({ name })

        if (res.status === 'error') {
          set({ ...SQLDefinitionInitialState })
          set({ SQLDefinitionObject: { ...ObjectInitialState } })
          set({ SQLDefinitionAligmentObject: { ...AligmentObjectInitialState } })
          set({
            SQLDefinitionError: {
              message: res.message,
              originalError: res.originalError,
            },
          })

          set({ loading: false })
          return
        }

        if (res.meta.length > 1) {
          set({ ...SQLDefinitionInitialState })
          set({ SQLDefinitionObject: { ...ObjectInitialState } })
          set({ SQLDefinitionAligmentObject: { ...AligmentObjectInitialState } })
          set({ SQLDefinitionObjectList: res.data })

          set({ loading: false })
          return
        }

        set({ ...SQLDefinitionInitialState })
        set({ SQLDefinitionObject: res.data[0] })
        set({ SQLDefinitionAligmentObject: { ...AligmentObjectInitialState } })
      },

      fetchSQLDefinition: async () => {
        const object = get().SQLDefinitionObject
        if (object.id === null) return

        set({ loading: true })

        const res = await getSQLDefinitionObject({ id: object.id })

        if (res.status === 'error') {
          set({ ...SQLDefinitionInitialState })
          set({
            SQLDefinitionError: {
              message: res.message,
              originalError: res.originalError,
            },
          })
          set({ loading: false })
          return
        }

        set({ ...SQLDefinitionInitialState })
        set({
          SQLDefinitionObject: {
            id: res.data.id,
            name: res.data.name,
            type: res.data.type,
            typeDesc: res.data.typeDesc,
            schema: res.data.schema,
            schemaId: res.data.schemaId,
            createDate: res.data.createDate,
            modifyDate: res.data.modifyDate,
            permission: res.data.permission,
          },
        })
        set({ SQLDefinitionCode: res.data.definition })
        set({ loading: false })
      },

      reset: () => {
        set({ SQLDefinitionObject: { ...ObjectInitialState } })
        set({ SQLDefinitionAligmentObject: { ...AligmentObjectInitialState } })
        set({ ...SQLDefinitionInitialState })
      },
    }),
    {
      name: 'sqldefinition', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
      // skipHydration: true,

      // excluye de la persistencia, algunos estados del store
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['SQLDefinitionError', 'errorAligment', 'loading', 'loadingAligment'].includes(key)),
        ),
    },
  ),
)
