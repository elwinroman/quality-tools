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
      </label>
      {errorValidation && <span className="text-xs text-rose-500">{errorValidation}</span>}
    </div>
  )
}
