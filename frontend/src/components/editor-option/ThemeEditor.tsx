import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { EDITOR_THEME_LABELS, EDITOR_THEME_MODE, type IMonacoThemeId, MonacoThemes } from '@/constants'
import { useEditorOptionsStore } from '@/zustand'

const THEME_OPTIONS = Object.entries(MonacoThemes)
  .map(([value, theme]) => ({ value: value as IMonacoThemeId, label: theme.name }))
  .sort((a, b) => a.label.localeCompare(b.label))

const MODE_OPTIONS = [
  { value: EDITOR_THEME_MODE.syncWithApp, label: EDITOR_THEME_LABELS.syncWithApp },
  { value: EDITOR_THEME_MODE.single, label: EDITOR_THEME_LABELS.single },
  { value: EDITOR_THEME_MODE.separate, label: EDITOR_THEME_LABELS.separate },
] as const

/** El panel usa una escala compacta, no la altura h-10 del trigger por defecto. */
const SELECT_TRIGGER_CLASS = 'h-7 w-[170px] px-2 text-xs'

interface SelectRowProps {
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}

/**
 * Fila de etiqueta mas Select de shadcn.
 *
 * El titulo no se envuelve en un `<label>`: el trigger de Radix ya es un boton, que
 * es labelable, asi que un label envolvente le roba el nombre accesible y puede
 * activar el control dos veces. En su lugar el trigger recibe `aria-label`.
 */
function SelectRow({ label, value, options, onChange }: SelectRowProps) {
  return (
    <div className="text-primary/70 flex items-center justify-between gap-2 text-xs">
      <span>{label}</span>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={SELECT_TRIGGER_CLASS} aria-label={label}>
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ThemeEditor() {
  const { themeMode, theme, lightTheme, darkTheme, updateThemeMode, updateTheme, updateLightTheme, updateDarkTheme } =
    useEditorOptionsStore((state) => state)

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <SelectRow
        label={EDITOR_THEME_LABELS.mode}
        value={themeMode}
        options={MODE_OPTIONS}
        onChange={(value) => updateThemeMode(value as typeof themeMode)}
      />

      {themeMode === EDITOR_THEME_MODE.single && (
        <SelectRow
          label={EDITOR_THEME_LABELS.theme}
          value={theme}
          options={THEME_OPTIONS}
          onChange={(value) => updateTheme(value as IMonacoThemeId)}
        />
      )}

      {themeMode === EDITOR_THEME_MODE.separate && (
        <>
          <SelectRow
            label={EDITOR_THEME_LABELS.lightTheme}
            value={lightTheme}
            options={THEME_OPTIONS}
            onChange={(value) => updateLightTheme(value as IMonacoThemeId)}
          />
          <SelectRow
            label={EDITOR_THEME_LABELS.darkTheme}
            value={darkTheme}
            options={THEME_OPTIONS}
            onChange={(value) => updateDarkTheme(value as IMonacoThemeId)}
          />
        </>
      )}
    </div>
  )
}
