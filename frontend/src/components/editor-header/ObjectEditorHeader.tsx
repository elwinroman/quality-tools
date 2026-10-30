interface ObjectEditorHeaderProps {
  left: React.ReactNode
  notice?: React.ReactNode
  actions: React.ReactNode
}

export function ObjectEditorHeader({ left, notice, actions }: ObjectEditorHeaderProps) {
  return (
    <header className="bg-background border-border flex h-14 items-center justify-between border-b px-4 max-lg:overflow-x-auto max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden">
      {left}
      {notice}
      {actions}
    </header>
  )
}
