import { AlertCircle as AlertCircleIcon } from '@/icons/alert-circle'

export function AlertMessages({ message, type }) {
  const alert = {}
  const log = typeof message === 'string' ? JSON.parse(message) : message

  if (type === 'error') {
    alert.className = 'border-[#f53e7b59] bg-[#592e41]'
    alert.icon = <AlertCircleIcon width={18} height={18} />
  }

  return (
    <div className={`flex gap-2 rounded-sm border px-4 py-2 ${alert.className}`}>
      <i className="pt-0.5">{alert.icon}</i>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-zinc-200">{log.message}</p>
        {log.originalError && <p className="text-xs text-zinc-300">{log.originalError}</p>}
      </div>
    </div>
  )
}
