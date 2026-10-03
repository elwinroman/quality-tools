interface ContentTitleProps {
  children: React.ReactNode
}

export function ContentTitle({ children }: ContentTitleProps) {
  return <h1 className="text-primary text-xl font-bold">{children}</h1>
}
