import type { Monaco } from '@monaco-editor/react'

import { ensureBuiltinTheme } from '@/utilities/ensure-builtin-theme.util'

import { UpstreamThemes } from './upstream-themes.generated'

export { type UpstreamThemeId, UpstreamThemes } from './upstream-themes.generated'

/**
 * Registro publico con todos los temas empaquetados por `monaco-themes`.
 *
 * Cada entrada expone `{ name, load }`: `name` es el nombre a mostrar y `load`
 * es un `import()` dinamico, de modo que cada tema se resuelve en su propio
 * chunk y el bundle inicial no carga los ~55 JSON.
 */
export const MonacoThemes = UpstreamThemes

/** Identificador canonico de un tema (slug del paquete, kebab-case). */
export type IMonacoThemeId = keyof typeof UpstreamThemes

/**
 * Datos de tema tal como los acepta `monaco.editor.defineTheme`.
 * Se deriva del tipo `Monaco` para no importar `monaco-editor` directamente
 * (es una dependencia transitiva y no resuelve como modulo propio).
 */
type StandaloneThemeData = Parameters<Monaco['editor']['defineTheme']>[1]

/** Overrides locales por tema, aplicados sobre el JSON que publica el paquete. */
type ThemeOverride = {
  colors?: Record<string, string>
}

/**
 * Correcciones locales que deben sobrevivir a la carga del JSON upstream.
 *
 * Dracula: el paquete publica `editorWhitespace.foreground = #3B3A32`, invisible
 * sobre el fondo `#282a36` del propio tema. El repositorio usaba historicamente
 * `#56c7f2` (un celeste visible), por eso se conserva como override explicito.
 */
const THEME_OVERRIDES: Partial<Record<IMonacoThemeId, ThemeOverride>> = {
  dracula: {
    colors: {
      'editorWhitespace.foreground': '#56c7f2',
    },
  },
}

/** Carga el JSON del tema y le aplica los overrides locales. */
const loadThemeDefinition = async (id: IMonacoThemeId): Promise<StandaloneThemeData> => {
  const themeModule = await UpstreamThemes[id].load()
  const json = themeModule.default as unknown as StandaloneThemeData
  const override = THEME_OVERRIDES[id]

  return {
    ...json,
    ...override,
    colors: { ...json.colors, ...override?.colors },
  } as StandaloneThemeData
}

/**
 * Cache de promesas de definicion: garantiza que cada tema se importe y se
 * defina, como maximo, una vez por proceso.
 */
const definedThemes = new Map<IMonacoThemeId, Promise<void>>()

/**
 * Importa y define un tema en Monaco de forma perezosa y memorizada.
 *
 * El JSON se carga con `import()` dinamico (chunk aparte), se le aplican los
 * overrides locales y se define con un `base` validado por `ensureBuiltinTheme`.
 */
export const ensureThemeDefined = (monacoInstance: Monaco, id: IMonacoThemeId): Promise<void> => {
  const cached = definedThemes.get(id)
  if (cached) return cached

  const definition = loadThemeDefinition(id).then((json) => {
    monacoInstance.editor.defineTheme(id, {
      ...json,
      base: ensureBuiltinTheme(json.base),
    })
  })

  definedThemes.set(id, definition)
  return definition
}
