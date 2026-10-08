import type { Monaco } from '@monaco-editor/react'

/**
 * Datos de tema tal como los acepta `monaco.editor.defineTheme`.
 * Se tipan de forma explicita para que ambos temas compartan la misma forma
 * (incluido `base`), sin depender de la inferencia de cada literal.
 */
type StandaloneThemeData = Parameters<Monaco['editor']['defineTheme']>[1]

/**
 * Tema claro de Quality Tools.
 *
 * Superficies alineadas a los tokens claros de la app (el fondo usa el mismo
 * valor que `--background-card`), y tokens de sintaxis inspirados en SSMS con
 * saturacion subida a la paleta de acentos champagne/pink del producto.
 *
 * Los colores de diferencia se derivan de los verdes y rojos de Oceanic Next, pero
 * un paso mas saturados (`#5FA84F` y `#E04E56`). El default de Monaco (verde
 * amarillo `#9ccc2c` y rojo puro `#ff0000`) resultaba muy potente, y los hues puros
 * de Oceanic al 15% quedaban demasiado apagados: la linea daba solo 7.2% de
 * saturacion contra 17.1% de Monaco. La vividez sale de la saturacion de la fuente
 * antes que del alpha, porque sobre un fondo claro el alpha apenas corre la mezcla
 * hacia el color. Queda por debajo del nivel de Monaco, con 13.4% de saturacion en
 * verde y 19.0% en rojo.
 */
const lightTheme: StandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: '', foreground: '312D33', background: 'FBF9F6' },
    { token: 'comment', foreground: '5E7A62', fontStyle: 'italic' },
    { token: 'keyword', foreground: '3F63B5', fontStyle: 'bold' },
    { token: 'string', foreground: 'B03A3F' },
    { token: 'number', foreground: '5F7A2E' },
    { token: 'operator', foreground: '6B6470' },
    { token: 'predefined.sql', foreground: 'A85A22' },
    { token: 'type.sql', foreground: '3F8A6E' },
    { token: 'function.sql', foreground: '9B3FA8' },
  ],
  colors: {
    // Mismo valor que `--background-card` del tema claro de la app.
    'editor.background': '#FBF9F6',
    'editor.foreground': '#312D33',
    'editorLineNumber.foreground': '#9A938A',
    'editorLineNumber.activeForeground': '#5B5650',
    'editorCursor.foreground': '#C25A96',
    'editor.selectionBackground': '#EFC0D8',
    'editor.inactiveSelectionBackground': '#F3D8E5',
    // Un paso por encima de la card: `--background-alternate`.
    'editor.lineHighlightBackground': '#F3EFE9',
    'editorIndentGuide.background': '#EDE7DD',
    'editorIndentGuide.activeBackground': '#C9BFB0',
    'editorWhitespace.foreground': '#D6CFC4',
    // Diff con los verdes/rojos de Oceanic Next. Verde = solo en el objeto local,
    // rojo = solo en produccion. Alphas suaves para no tapar las decoraciones.
    'diffEditor.insertedLineBackground': '#5FA84F3D',
    'diffEditor.removedLineBackground': '#E04E563D',
    'diffEditor.insertedTextBackground': '#5FA84F3D',
    'diffEditor.removedTextBackground': '#E04E563D',
  },
}

/**
 * Tema oscuro de Quality Tools.
 *
 * Los hues de sintaxis y el color de texto (`#CDD3DE`) se toman de Oceanic Next,
 * el tema default historico de la app, asentados sobre nuestra superficie graphite
 * en lugar de su fondo `#1B2B34`. De la app se conservan el fondo
 * (`--background-card`), el cursor pink, los guides y el whitespace, que ya
 * resolvian armonia con el resto de la interfaz.
 *
 * Oceanic Next no define colores de diferencia. Los defaults de Monaco (verde
 * amarillo `#9ccc2c` y rojo puro `#ff0000`) resultaban muy potentes, y los hues
 * puros de Oceanic al 15% quedaban demasiado apagados: el verde daba 10% de
 * saturacion contra 45% de Monaco. Se usan verdes y rojos derivados de Oceanic
 * pero un paso mas saturados (`#84CE74` y `#F0525F`), al 18% de alpha.
 *
 * La vividez sale de la saturacion de la fuente antes que del alpha. Aun asi queda
 * por debajo del nivel de Monaco, con 21.1% de saturacion en verde contra 45%.
 *
 * Un unico valor queda por debajo de AA: el `comment` de Oceanic Next es
 * `#65737E`, que da 3.61:1 sobre nuestro fondo (y 2.99:1 sobre el suyo propio).
 * Se conserva por fidelidad al tema; subirlo a `#7C8A96` lo llevaria a AA.
 *
 * Los nombres de token son los que Monaco emite realmente: el tokenizer de SQL
 * declara `tokenPostfix: '.sql'` y Monarch concatena ese sufijo, asi que el
 * conjunto real es keyword, string, number, comment, operator, delimiter,
 * predefined e identifier (verificado en `basic-languages/sql/sql.js`). No existen
 * `type.sql` ni `function.sql`: las funciones builtin se emiten como
 * `predefined.sql` y los nombres propios como `identifier.sql`.
 */
const darkTheme: StandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'CDD3DE', background: '1A181E' },
    { token: 'comment', foreground: '65737E', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'C594C5', fontStyle: 'bold' },
    { token: 'string', foreground: '99C794' },
    { token: 'number', foreground: 'F99157' },
    { token: 'predefined.sql', foreground: '6699CC' },
    { token: 'operator', foreground: '5FB3B3' },
    { token: 'delimiter', foreground: '5FB3B3' },
  ],
  colors: {
    // Mismo valor que `--background-card` del tema oscuro de la app.
    'editor.background': '#1A181E',
    'editor.foreground': '#CDD3DE',
    'editorLineNumber.foreground': '#7F746B',
    'editorLineNumber.activeForeground': '#B6AAA0',
    'editorCursor.foreground': '#F095C8',
    'editor.selectionBackground': '#4F5B66',
    'editor.inactiveSelectionBackground': '#39434D',
    // Un paso por encima de la card: `--background-alternate`.
    'editor.lineHighlightBackground': '#211E25',
    'editorIndentGuide.background': '#2E2A26',
    'editorIndentGuide.activeBackground': '#57504A',
    'editorWhitespace.foreground': '#5C554E',
    // Diff con los verdes/rojos de Oceanic Next. Verde = solo en el objeto local,
    // rojo = solo en produccion. Alphas suaves para no tapar las decoraciones.
    'diffEditor.insertedLineBackground': '#84CE742E',
    'diffEditor.removedLineBackground': '#F0525F2E',
    'diffEditor.insertedTextBackground': '#84CE742E',
    'diffEditor.removedTextBackground': '#F0525F2E',
  },
}

/**
 * Envuelve una definicion local en la misma forma `{ name, load }` que publica
 * el registro upstream, para que el cargador compartido la trate igual (sin
 * `import()` dinamico: el tema ya vive en el bundle).
 */
const localTheme = (name: string, definition: StandaloneThemeData) => ({
  name,
  load: async () => ({ default: definition }),
})

/** Temas propios de Quality Tools, armonizados con el modo claro y oscuro de la app. */
export const LocalThemes = {
  'quality-tools-sql-light': localTheme('Quality Tools SQL Light', lightTheme),
  'quality-tools-sql-dark': localTheme('Quality Tools SQL Dark', darkTheme),
} as const
