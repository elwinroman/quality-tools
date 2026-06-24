import { isAxiosError } from 'axios'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { FullSysObject, SysObjectRelation, TypeViews, ViewMode } from '@/models/sysobject'
import { getProdSysObjectService } from '@/services'

import { getSysObjectByNameService, getSysObjectDependenciesService, getSysObjectDependentsService } from '../services/sysobject.service'

interface SysObjectError {
  title: string
  detail: string
}

interface SysObjectState {
  /** Modo de visualización actual para el objeto SQL. */
  viewMode: ViewMode

  /** Objeto SQL. Si no existe, es `null`. */
  sysobject: FullSysObject | null

  /** Código disponible visualmente en el editor (monaco) */
  currentEditorCode: string

  /** Indica si se está cargando un objeto desde el buscador */
  isLoadingObject: boolean

  /** Error al obtener el objeto SQL */
  errorObject: SysObjectError | null

  /** Objetos que el objeto SQL actual usa. */
  dependencies: SysObjectRelation[]

  /** Objetos que usan al objeto SQL actual. */
  dependents: SysObjectRelation[]

  /** Indica si se estan cargando dependencias y dependientes. */
  isLoadingRelations: boolean

  /** Error al obtener dependencias o dependientes. */
  errorRelations: SysObjectError | null

  /** Obtiene un objeto por esquema y nombre desde la API y actualiza el store */
  fetchSysObjectByName: (schema: string, name: string) => Promise<void>

  /** Obtiene dependencias y dependientes del objeto SQL actual. */
  fetchSysObjectRelations: () => Promise<void>

  /** Actualiza el error del objeto SQL */
  updateErrorObject: (error: SysObjectError | null) => void

  /** Objeto SQL de pre-producción para comparación. Si no existe, es `null`. */
  prodSysobject: FullSysObject | null

  /** Indica si se está cargando el objeto de pre-producción */
  isLoadingProdObject: boolean

  /** Error al obtener el objeto de pre-producción */
  errorProdObject: SysObjectError | null

  /** Obtiene el objeto de pre-producción desde la API para comparación */
  fetchProdSysObject: () => Promise<void>

  /** Crea el objeto con la data recuperada en el buscador */
  createSysObject: (sysobject: FullSysObject | null) => void

  /** Establece un nuevo modo de visualización para el objeto. */
  updateViewMode: (mode: ViewMode) => void

  /** Establece el código del editor */
  updateCurrentEditorCode: (code: string) => void

  /** Reinicia el estado al valor inicial por defecto. */
  reset: () => void
}

const initialState: Pick<SysObjectState, 'viewMode' | 'sysobject' | 'prodSysobject'> = {
  viewMode: TypeViews.FullView,
  sysobject: null,
  prodSysobject: null,
}

export const useSysObjectStore = create<SysObjectState>()(
  persist(
    (set, get) => ({
      ...initialState,
      currentEditorCode: '',
      isLoadingObject: false,
      isLoadingProdObject: false,
      isLoadingRelations: false,
      errorObject: null,
      errorProdObject: null,
      errorRelations: null,
      dependencies: [],
      dependents: [],

      updateErrorObject: (error) => {
        set({ errorObject: error })
      },

      fetchSysObjectByName: async (schema: string, name: string) => {
        set({ isLoadingObject: true })
        try {
          const { call } = getSysObjectByNameService(schema, name)
          const response = await call
          set({
            sysobject: response.data,
            prodSysobject: null,
            errorProdObject: null,
            errorObject: null,
            errorRelations: null,
            dependencies: [],
            dependents: [],
          })
        } catch (err) {
          if (isAxiosError(err) && err.response) {
            const { data } = err.response
            set({
              errorObject: {
                title: data.error?.title ?? 'Error al obtener el objeto',
                detail: data.error?.detail ?? 'Error desconocido',
              },
            })
          } else {
            set({
              errorObject: {
                title: 'Error de red',
                detail: 'No se pudo conectar al servidor o el servidor no está disponible.',
              },
            })
          }
        } finally {
          set({ isLoadingObject: false })
        }
      },

      fetchSysObjectRelations: async () => {
        const { sysobject, dependencies, dependents, errorRelations } = get()
        if (!sysobject) return

        if (dependencies.length > 0 || dependents.length > 0 || errorRelations) return

        set({ isLoadingRelations: true })
        try {
          const dependenciesCall = getSysObjectDependenciesService(sysobject.schemaName, sysobject.name)
          const dependentsCall = getSysObjectDependentsService(sysobject.schemaName, sysobject.name)

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

      fetchProdSysObject: async () => {
        const { sysobject, prodSysobject, errorProdObject } = get()
        if (!sysobject) return

        // si ya hay resultado (éxito o error), no repetir la llamada
        if (prodSysobject || errorProdObject) return

        set({ isLoadingProdObject: true })
        try {
          const { call } = getProdSysObjectService({
            name: sysobject.name,
            schema: sysobject.schemaName,
            actionType: 1,
          })
          const response = await call
          set({ prodSysobject: response.data })
        } catch (err) {
          if (isAxiosError(err) && err.response) {
            const { data } = err.response
            set({
              errorProdObject: {
                title: data.error?.title ?? 'Error desconocido',
                detail: data.error?.detail ?? 'Error desconocido',
              },
            })
          } else {
            set({
              errorProdObject: {
                title: 'Error de red',
                detail: 'No se pudo conectar al servidor o el servidor no está disponible.',
              },
            })
          }
        } finally {
          set({ isLoadingProdObject: false })
        }
      },

      createSysObject: (sysobject: FullSysObject | null) =>
        set({ sysobject, prodSysobject: null, errorProdObject: null, dependencies: [], dependents: [], errorRelations: null }),
      updateViewMode: (mode: ViewMode) => set({ viewMode: mode }),
      updateCurrentEditorCode: (code: string) => set({ currentEditorCode: code }),
      reset: () => {
        set({
          ...initialState,
          currentEditorCode: '',
          isLoadingObject: false,
          isLoadingProdObject: false,
          isLoadingRelations: false,
          errorObject: null,
          errorProdObject: null,
          errorRelations: null,
          dependencies: [],
          dependents: [],
        })
      },
    }),
    {
      name: 'app.sysobject.session',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
