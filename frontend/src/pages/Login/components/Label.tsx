export function Label({ text }: { text: string }) {
  return (
    <label htmlFor="" className="flex gap-1">
      <span className="text-secondary text-sm font-medium">{text}</span>
      <span className="text-gentle-pink-600 dark:text-gentle-pink-400">*</span>
    </label>
  )
}
