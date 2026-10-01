import { useSearchContext } from '@aligment/hooks'
import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { InputWithIcon } from '@/components/ui'

export function SearchAligment() {
  const [isFocus, setFocus] = useState<boolean>(false)
  const [hasInput, setHasInput] = useState<boolean>(false)

  const { search, updateSearch, errorValidation, getObject, loading } = useSearchContext()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/') return

      const target = e.target as HTMLElement
      const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (isEditable) return

      e.preventDefault()
      inputRef.current?.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Maneja los eventos de teclado
  const handleKeyup = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (search === '') setHasInput(false)
    else setHasInput(true)

    // evento ENTER
    if (!loading && e.key === 'Enter') await getObject()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearch(e.target.value)
  }

  // Maneja el evento click en el icono borrar
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    setHasInput(false)
    updateSearch('')
    inputRef.current?.focus()
  }

  const icon = hasInput ? <X size={22} /> : undefined

  return (
    <div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Objeto</span>

        <div className="group relative">
          <InputWithIcon
            ref={inputRef}
            value={search}
            startIcon={<Search size={22} className="text-muted" />}
            endIcon={icon}
            placeholder="Search"
            onChange={handleChange}
            onKeyUp={handleKeyup}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            handleClick={handleClick}
            isFocus={isFocus}
            spellCheck="false"
            title="Borrar"
          />

          {/* El atajo se muestra al apuntar; sin hover disponible (táctil) queda siempre visible.
              Se oculta con texto porque ese lugar lo ocupa el botón de borrar. */}
          {!hasInput && (
            <kbd
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-sm bg-black px-1 py-0.5 font-sans text-[10px] leading-none font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            >
              /
            </kbd>
          )}
        </div>
      </label>
      {errorValidation && <span className="text-xs text-rose-500">{errorValidation}</span>}
    </div>
  )
}
