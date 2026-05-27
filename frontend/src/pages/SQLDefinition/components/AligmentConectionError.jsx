import { CircleX } from 'lucide-react'

export function AligmentConectionError() {
  return (
    <div className="flex w-full items-center gap-2 border-[rgba(238,51,94,0.1)] bg-[rgba(238,51,94,0.1)] px-4 py-2 text-sm text-red-500">
      <i>
        <CircleX size={16} />
      </i>
      <span>Opps. Parece que existe un error de conexión con el servidor de alineación, por favor, contacte con su administrador.</span>
    </div>
  )
}
