import { AlertCircle } from 'lucide-react'

export default function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3.5 py-3 mb-5"
    >
      <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
      <p className="text-[13px] text-red-300 leading-relaxed">{message}</p>
    </div>
  )
}
