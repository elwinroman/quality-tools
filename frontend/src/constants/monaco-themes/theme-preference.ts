import type { IMonacoThemeId } from './monaco-themes'
import { MonacoThemes } from './monaco-themes'

export const QUALITY_TOOLS_SQL_THEME_IDS = {
  light: 'quality-tools-sql-light',
  dark: 'quality-tools-sql-dark',
} as const satisfies Record<string, IMonacoThemeId>

export const EDITOR_THEME_MODE = {
  syncWithApp: 'sync-with-app',
  single: 'single',
  separate: 'separate',
} as const

export type EditorThemeMode = (typeof EDITOR_THEME_MODE)[keyof typeof EDITOR_THEME_MODE]

export const DEFAULT_EDITOR_THEME_PREFERENCE = {
  themeMode: EDITOR_THEME_MODE.syncWithApp,
  theme: QUALITY_TOOLS_SQL_THEME_IDS.dark,
  lightTheme: QUALITY_TOOLS_SQL_THEME_IDS.light,
  darkTheme: QUALITY_TOOLS_SQL_THEME_IDS.dark,
} as const satisfies EditorThemePreference

export const EDITOR_THEME_LABELS = {
  mode: 'Comportamiento del tema',
  syncWithApp: 'Seguir la apariencia de la app',
  single: 'Usar un solo tema',
  separate: 'Temas distintos para claro y oscuro',
  lightTheme: 'Tema claro',
  darkTheme: 'Tema oscuro',
  theme: 'Tema del editor',
  placeholder: 'Elegir un tema',
  empty: 'Sin coincidencias',
} as const

export interface EditorThemePreference {
  themeMode: EditorThemeMode
  theme: IMonacoThemeId
  lightTheme: IMonacoThemeId
  darkTheme: IMonacoThemeId
}

export const isEditorThemeMode = (value: unknown): value is EditorThemeMode =>
  Object.values(EDITOR_THEME_MODE).includes(value as EditorThemeMode)

export const isMonacoThemeId = (value: unknown): value is IMonacoThemeId => typeof value === 'string' && value in MonacoThemes

export const resolveEditorThemePreference = (preference: EditorThemePreference, isDark: boolean): IMonacoThemeId => {
  if (preference.themeMode === EDITOR_THEME_MODE.single) return preference.theme
  if (preference.themeMode === EDITOR_THEME_MODE.separate) return isDark ? preference.darkTheme : preference.lightTheme
  return isDark ? DEFAULT_EDITOR_THEME_PREFERENCE.darkTheme : DEFAULT_EDITOR_THEME_PREFERENCE.lightTheme
}
