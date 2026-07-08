import { motion } from 'framer-motion'
import { FolderOpen, FileText, Clock } from 'lucide-react'
import { formatRelativeDate } from '../lib/format.js'

// Deterministic accent color per subject name, purely for visual variety
// across folder cards — not tied to any data.
const ACCENTS = [
  { text: 'text-primary-light', bg: 'bg-primary/10', border: 'border-primary/20' },
  { text: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/20' },
  { text: 'text-accent-violet', bg: 'bg-accent-violet/10', border: 'border-accent-violet/20' },
  { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
]

function accentFor(name) {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return ACCENTS[sum % ACCENTS.length]
}

export default function SubjectCard({ subject, semester, totalResources, lastUpdated, onClick }) {
  const accent = accentFor(subject)

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group text-left rounded-2xl border border-white/[0.07] bg-base-card/50 hover:border-primary/25 p-5 transition-colors shadow-card"
    >
      <span className={`w-11 h-11 rounded-xl ${accent.bg} border ${accent.border} flex items-center justify-center`}>
        <FolderOpen size={19} className={accent.text} />
      </span>

      <h3 className="mt-4 font-display text-[15px] font-semibold text-ink line-clamp-1">{subject}</h3>
      <p className="mt-1 text-[11px] text-ink-faint eyebrow">SEMESTER {semester}</p>

      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <FileText size={12} />
          {totalResources} {totalResources === 1 ? 'resource' : 'resources'}
        </span>
        <span className="flex items-center gap-1.5 text-ink-faint">
          <Clock size={12} />
          {formatRelativeDate(lastUpdated)}
        </span>
      </div>
    </motion.button>
  )
}
