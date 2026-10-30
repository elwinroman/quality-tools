import { Moon, Sun } from 'lucide-react'
import { useId } from 'react'

import { useAppStore } from '@/zustand'

export function ThemeToggle() {
  const isDark = useAppStore((state) => state.isDark)
  const updateDark = useAppStore((state) => state.updateDark)
  // id único: el switch puede montarse a la vez en el perfil y en el header de Aligment
  const toggleId = useId()

  // cambia el estado del theme toggle
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => updateDark(e.target.checked)

  return (
    <div className="flex items-center">
      <input type="checkbox" id={toggleId} className="theme-toggle-input hidden" onChange={handleChange} checked={isDark} />
      <div className="wrapper inline-flex items-center justify-center">
        <label className="bg-background-neutral border-border relative h-5 w-10 cursor-pointer rounded-xl border" htmlFor={toggleId}>
          {/* Circulo */}
          <div className="circle absolute top-[50%] left-0 flex h-4 w-4 translate-x-[10%] translate-y-[-50%] items-center justify-center rounded-full bg-white transition-all duration-300">
            <Sun size={12} strokeWidth={3} className="isun text-champagne-700 absolute mt-0 opacity-100 transition-all duration-300" />
            <Moon size={12} className="imoon absolute mt-[-150%] text-white opacity-0 transition-all duration-300" />
          </div>
        </label>
      </div>
    </div>
  )
}
