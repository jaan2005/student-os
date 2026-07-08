import { Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={22} className="text-primary-light animate-spin" />
        <p className="eyebrow text-[11px] text-ink-faint">LOADING</p>
      </div>
    </div>
  )
}
