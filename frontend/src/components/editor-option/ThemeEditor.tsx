import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui'
import { MonacoThemes } from '@/constants'
import { IMonacoTheme } from '@/models'
import { useEditorOptionsStore } from '@/zustand'

/** Opcion del selector: el slug del tema como valor y su nombre como etiqueta. */
type ThemeOption = {
  value: IMonacoTheme
  label: string
}

/** Todos los temas del registro, ordenados por nombre a mostrar. */
const THEME_OPTIONS: ThemeOption[] = Object.entries(MonacoThemes)
  .map(([value, theme]) => ({ value: value as IMonacoTheme, label: theme.name }))
  .sort((a, b) => a.label.localeCompare(b.label))

export function ThemeEditor() {
  const updateTheme = useEditorOptionsStore((state) => state.updateTheme)
  const theme = useEditorOptionsStore((state) => state.theme)

  const selectedTheme = THEME_OPTIONS.find((option) => option.value === theme) ?? null

  return (
    <Combobox
      items={THEME_OPTIONS}
      value={selectedTheme}
      autoHighlight
      onValueChange={(option) => {
        if (option) updateTheme(option.value)
      }}
      isItemEqualToValue={(item, value) => item.value === value.value}
    >
      {/* Al enfocar se selecciona todo: el input muestra el tema activo, y sin esto
          lo tipeado se concatenaria a ese nombre y el filtro no encontraria nada. */}
      <ComboboxInput
        className="h-7 w-[180px] text-xs"
        placeholder="Editor theme"
        aria-label="Editor theme"
        title="Editor theme"
        onFocus={(event) => event.currentTarget.select()}
        onMouseUp={(event) => event.preventDefault()}
      />
      <ComboboxContent>
        <ComboboxEmpty>No themes found</ComboboxEmpty>
        <ComboboxList>
          {(option: ThemeOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
