import { RotateCcw, Settings, X } from 'lucide-react'
import { MouseEvent } from 'react'
import { toast } from 'sonner'

import { FontSize, ThemeEditor } from '@/components/editor-option'
import { Switch } from '@/components/ui'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'
import { useEditorOptionsStore } from '@/zustand'

interface Props {
  className?: string
}
// whitespace options
const RenderWhitespaceOption = {
  All: 'all',
  None: 'none',
  Boundary: 'boundary',
  Selection: 'selection',
  Trailing: 'trailing',
} as const

export function ConfigOptionEditor({ className = '' }: Props) {
  const { guides, stickyScroll, minimap, renderWhitespace } = useEditorOptionsStore((state) => state)
  const resetEditorOptions = useEditorOptionsStore((state) => state.resetEditorOptions)
  const updateRenderWhitespace = useEditorOptionsStore((state) => state.updateRenderWhitespace)
  const updateMinimap = useEditorOptionsStore((state) => state.updateMinimap)
  const updateStickyScroll = useEditorOptionsStore((state) => state.updateStickyScroll)
  const updateGuides = useEditorOptionsStore((state) => state.updateGuides)

  const renderWhitespaceState = renderWhitespace !== RenderWhitespaceOption.None

  const handleOnChange = (option: string, value: boolean) => {
    switch (option) {
      case 'renderWhitespace':
        updateRenderWhitespace(value ? RenderWhitespaceOption.All : RenderWhitespaceOption.None)
        break
      case 'minimap':
        updateMinimap(value)
        break
      case 'stickyScroll':
        updateStickyScroll(value)
        break
      case 'guides':
        updateGuides(value)
        break
      default:
        break
    }
  }

  // configuración de las opciones de editor que se mostrarán en la UI
  const editorOptions = [
    {
      label: 'Mostrar indentación',
      checked: renderWhitespaceState,
      onChange: (checked: boolean) => handleOnChange('renderWhitespace', checked),
    },
    {
      label: 'Mostrar minimapa',
      checked: minimap.enabled,
      onChange: (checked: boolean) => handleOnChange('minimap', checked),
    },
    {
      label: 'Habilitar sticky scroll',
      checked: stickyScroll.enabled,
      onChange: (checked: boolean) => handleOnChange('stickyScroll', checked),
    },
    {
      label: 'Habilitar guías de indentación',
      checked: guides.indentation,
      onChange: (checked: boolean) => handleOnChange('guides', checked),
    },
  ]

  // resetea la configuración del editor
  const handleResetConfigOptions = (e: MouseEvent) => {
    e.preventDefault()
    resetEditorOptions()
    toast.success('Success', { description: 'Configuración del editor reiniciada' })
  }

  return (
    <Sheet modal={false}>
      <SheetTrigger>
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild className="grid place-content-center">
              <button className={`group h-7 rounded-sm px-2 not-disabled:hover:bg-white/[0.08] ${className}`}>
                <Settings size={14} className="group-hover:text-secondary group-disabled:text-disabled text-primary" />
              </button>
            </TooltipTrigger>

            <TooltipContent side="bottom">
              <p>Configuración de editor</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </SheetTrigger>

      {/* Contenido */}
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Configuración de editor</span>

            <div className="flex items-center gap-2">
              {/* Resetear configuración editor */}
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild className="grid place-content-center">
                    <RotateCcw
                      className="data-[state=open]:bg-secondary cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden disabled:pointer-events-none"
                      size={16}
                      onClick={handleResetConfigOptions}
                    />
                  </TooltipTrigger>

                  <TooltipContent side="bottom">
                    <p>Resetear editor</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/*  Cerrar */}
              <SheetClose className="data-[state=open]:bg-secondary rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden disabled:pointer-events-none">
                <X size={18} />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>
          </SheetTitle>

          <SheetDescription>
            <div className="flex flex-col gap-5">
              <p>Ajusta las preferencias del editor según tus necesidades.</p>
              <div className="flex justify-between gap-2">
                <ThemeEditor />
                <FontSize />
              </div>

              <ul className="flex flex-col gap-3">
                {editorOptions.map(({ label, checked, onChange }, index) => (
                  <li key={index} className="flex justify-between gap-2">
                    <span className="text-primary/70 overflow-hidden text-xs text-ellipsis whitespace-nowrap">{label}</span>
                    <Switch checked={checked} onCheckedChange={onChange} />
                  </li>
                ))}
              </ul>
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}
