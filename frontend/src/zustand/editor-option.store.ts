import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { DEFAULT_EDITOR_THEME_PREFERENCE, EDITOR_THEME_MODE, EditorThemeMode, isEditorThemeMode, isMonacoThemeId } from '@/constants'
import { MAX_FONT_SIZE, MIN_FONT_SIZE } from '@/enviroment/enviroment'
import { IMonacoTheme } from '@/models'
import { BearEditorOptionsState } from '@/models/zustand'

/** Version actual de la forma persistida. Se incrementa al romper compatibilidad. */
const PERSIST_VERSION = 3

/** Tema por defecto cuando no hay una preferencia valida persistida. */
const DEFAULT_THEME: IMonacoTheme = DEFAULT_EDITOR_THEME_PREFERENCE.theme
const DEFAULT_LIGHT_THEME: IMonacoTheme = DEFAULT_EDITOR_THEME_PREFERENCE.lightTheme
const DEFAULT_DARK_THEME: IMonacoTheme = DEFAULT_EDITOR_THEME_PREFERENCE.darkTheme
const DEFAULT_MODE: EditorThemeMode = DEFAULT_EDITOR_THEME_PREFERENCE.themeMode

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

/** Canonicaliza un id persistido; devuelve `null` si no es un tema conocido. */
const resolvePersistedThemeId = (persistedTheme: unknown): IMonacoTheme | null => {
  if (typeof persistedTheme !== 'string') return null
  const canonicalTheme = LEGACY_THEME_IDS[persistedTheme] ?? persistedTheme
  return isMonacoThemeId(canonicalTheme) ? canonicalTheme : null
}

/** Resuelve el tema persistido a un id canonico, o al valor de respaldo si es desconocido. */
const migrateTheme = (persistedTheme: unknown, fallback: IMonacoTheme): IMonacoTheme => resolvePersistedThemeId(persistedTheme) ?? fallback

const initialState: Pick<
  BearEditorOptionsState,
  | 'fontSize'
  | 'renderWhitespace'
  | 'renderSideBySide'
  | 'theme'
  | 'themeMode'
  | 'lightTheme'
  | 'darkTheme'
  | 'minimap'
  | 'stickyScroll'
  | 'guides'
  | 'normalizeWhitespace'
> = {
  fontSize: 13,
  renderWhitespace: 'none',
  renderSideBySide: true,
  theme: DEFAULT_THEME,
  themeMode: DEFAULT_MODE,
  lightTheme: DEFAULT_LIGHT_THEME,
  darkTheme: DEFAULT_DARK_THEME,
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
      updateThemeMode: (themeMode) => set({ themeMode }),
      updateLightTheme: (lightTheme) => set({ lightTheme }),
      updateDarkTheme: (darkTheme) => set({ darkTheme }),
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
      // Normaliza ids antiguos y conserva cualquier tema previo valido en modo unico.
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as Partial<BearEditorOptionsState>
        const persistedTheme = resolvePersistedThemeId(state.theme)

        const migratedState = {
          ...state,
          theme: persistedTheme ?? DEFAULT_THEME,
          lightTheme: migrateTheme(state.lightTheme, DEFAULT_LIGHT_THEME),
          darkTheme: migrateTheme(state.darkTheme, DEFAULT_DARK_THEME),
        }

        if (version >= PERSIST_VERSION) {
          return { ...migratedState, themeMode: isEditorThemeMode(state.themeMode) ? state.themeMode : DEFAULT_MODE }
        }

        // v2 -> v3: se fuerza una vez "seguir la apariencia de la app" para que los
        // usuarios existentes dejen de arrastrar un tema fijado en localStorage. La
        // preferencia se puede volver a cambiar desde el panel despues de esta migracion.
        if (version >= 2) return { ...migratedState, themeMode: DEFAULT_MODE }

        // v0/v1 solo guardaban un tema: si era valido se conserva tal cual en modo
        // unico (misma apariencia que el usuario ya tenia); si no habia una
        // preferencia valida, se adopta el nuevo default sincronizado con la app.
        return { ...migratedState, themeMode: persistedTheme ? EDITOR_THEME_MODE.single : DEFAULT_MODE }
      },
    },
  ),
)
