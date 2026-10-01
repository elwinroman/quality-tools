import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { MAX_FONT_SIZE, MIN_FONT_SIZE } from '@/enviroment/enviroment'
import { IMonacoTheme } from '@/models'
import { BearEditorOptionsState } from '@/models/zustand'

/** Version actual de la forma persistida. Se incrementa al romper compatibilidad. */
const PERSIST_VERSION = 1

/** Tema por defecto cuando no hay uno valido persistido. */
const DEFAULT_THEME: IMonacoTheme = 'oceanic-next'

/**
 * Mapa de ids de tema historicos (previos a la adopcion de los slugs del
 * paquete `monaco-themes`) hacia los ids canonicos actuales.
 *
 * Los ids que ya coincidian (`amy`, `blackboard`, `dracula`, `eiffel`,
 * `iplastic`, `katzenmilch`, `nord`) se incluyen igual para documentar el mapeo
 * completo. Nota: el slug canonico de iPlastic es `iplastic` (asi figura en
 * `themelist.json` del paquete), no `i-plastic`.
 */
const LEGACY_THEME_IDS: Record<string, IMonacoTheme> = {
  amy: 'amy',
  blackboard: 'blackboard',
  brillianceblack: 'brilliance-black',
  chromedevtools: 'chrome-devtools',
  dracula: 'dracula',
  eiffel: 'eiffel',
  githubdark: 'github-dark',
  iplastic: 'iplastic',
  katzenmilch: 'katzenmilch',
  nightowl: 'night-owl',
  nord: 'nord',
  oceanicnext: 'oceanic-next',
  solarizedlight: 'solarized-light',
  tomorrownightblue: 'tomorrow-night-blue',
  tomorrownighteighties: 'tomorrow-night-eighties',
  vibrantink: 'vibrant-ink',
}

/** Resuelve el tema persistido a un id canonico, o al tema por defecto si es desconocido. */
const migrateTheme = (persistedTheme: unknown): IMonacoTheme => {
  if (typeof persistedTheme !== 'string') return DEFAULT_THEME
  return LEGACY_THEME_IDS[persistedTheme] ?? DEFAULT_THEME
}

const initialState: Pick<
  BearEditorOptionsState,
  'fontSize' | 'renderWhitespace' | 'renderSideBySide' | 'theme' | 'minimap' | 'stickyScroll' | 'guides' | 'normalizeWhitespace'
> = {
  fontSize: 13,
  renderWhitespace: 'none',
  renderSideBySide: true,
  theme: DEFAULT_THEME,
  minimap: {
    enabled: true,
    side: 'right',
    renderCharacters: true,
    showSlider: 'mouseover',
  },
  stickyScroll: {
    enabled: false,
  },
  guides: {
    highlightActiveIndentation: true,
    indentation: false,
  },
  normalizeWhitespace: false,
}

export const useEditorOptionsStore = create<BearEditorOptionsState>()(
  persist(
    (set) => ({
      ...initialState,

      updateFontSize: (size) => {
        if (size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) set({ fontSize: size })
      },
      updateRenderWhitespace: (value) => set({ renderWhitespace: value }),
      updateRenderSideBySide: (state) => set({ renderSideBySide: state }),
      updateTheme: (theme) => set({ theme }),
      updateMinimap: (state) =>
        set((prev) => ({
          minimap: {
            ...prev.minimap,
            enabled: state,
          },
        })),
      updateStickyScroll: (state) =>
        set((prev) => ({
          stickyScroll: {
            ...prev.stickyScroll,
            enabled: state,
          },
        })),
      updateGuides: (state) =>
        set((prev) => ({
          guides: {
            ...prev.guides,
            indentation: state,
          },
        })),
      updateNormalizeWhitespace: (state) => set({ normalizeWhitespace: state }),
      resetEditorOptions: () => set({ ...initialState }),
    }),
    {
      name: 'app.global.monacoeditor.options',
      storage: createJSONStorage(() => localStorage),
      version: PERSIST_VERSION,
      // Migra los ids de tema historicos hacia los slugs del paquete para que
      // ningun usuario pierda el tema que tenia guardado.
      migrate: (persistedState, version) => {
        const state = persistedState as BearEditorOptionsState
        if (version < PERSIST_VERSION) {
          return { ...state, theme: migrateTheme(state.theme) }
        }
        return state
      },
    },
  ),
)
