import { Sparkles } from 'lucide-react'

export default function AICreditsBadge({ credits, limit, className = '' }) {
  const isLow = credits === 0

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
        isLow
          ? 'text-red-400 bg-red-500/10 border-red-500/25'
          : 'text-primary-light bg-primary/10 border-primary/25'
      } ${className}`}
      title="Daily AI credits — resets every day"
    >
      <Sparkles size={12} />
      {credits} / {limit} AI credits today
    </span>
  )
}
