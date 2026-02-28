import {
  IEditorStickyScrollOptions,
  IFontSize,
  IGuidesOptions,
  IMinimap,
  IMonacoTheme,
  IRenderSideBySide,
  IRenderWhitespace,
} from '@/models'

/**
 * Estado de configuración del editor de código, que controla
 * opciones visuales y funcionales relacionadas con la edición.
 */
export interface BearEditorOptionsState {
  /** Tamaño de fuente utilizado en el editor (en píxeles). */
  fontSize: IFontSize

  /** Controla cómo se muestran los caracteres de espacio en blanco (por ejemplo, espacios y tabulaciones). */
  renderWhitespace: IRenderWhitespace

  /**
   * Indica si el editor debe mostrar vistas lado a lado (side-by-side),
   * usado solo en el editor de comparación.
   */
  renderSideBySide: IRenderSideBySide

  /** Configura la visibilidad del minimapa (pequeña vista previa del código a la derecha). */
  minimap: IMinimap

  /** Habilita el "sticky scroll" (encabezado flotante que muestra el contexto del código). */
  stickyScroll: IEditorStickyScrollOptions

  /** Muestra guias verticales de indentación */
  guides: IGuidesOptions

  /** Tema visual aplicado al editor, e.g., 'light', 'dark', etc. */
  theme: IMonacoTheme

  /** Actualiza el tamaño de fuente del editor. */
  updateFontSize: (size: IFontSize) => void

  /** Cambia la configuración de visualización de espacios en blanco. */
  updateRenderWhitespace: (value: IRenderWhitespace) => void

  /** Establece si el editor muestra vista lado a lado o no. */
  updateRenderSideBySide: (state: IRenderSideBySide) => void

  /** Estable si se muestra el minimapa */
  updateMinimap: (state: boolean) => void

  /** Habilita o deshabilita el sticky scroll */
  updateStickyScroll: (state: boolean) => void

  /** Actualiza las guía de indentación verticales */
  updateGuides: (state: boolean) => void

  /** Cambia el tema visual del editor. */
  updateTheme: (theme: IMonacoTheme) => void

  /**
   * Indica si se debe normalizar el whitespace (tabs → espacios) antes de comparar.
   * Evita que diferencias de indentación oculten cambios reales de código.
   * Aplica solo en el DiffEditor.
   */
  normalizeWhitespace: boolean

  /** Activa o desactiva la normalización de whitespace en el diff. */
  updateNormalizeWhitespace: (state: boolean) => void

  /** Resetea los valores */
  resetEditorOptions: () => void
}
