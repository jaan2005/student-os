import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function AIPanelShell({ open, onClose, title, icon: Icon, children }) {
  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl glass shadow-glow-lg p-6 sm:p-7"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                <Icon size={17} className="text-primary-light" />
              </span>
              <h3 className="font-display text-lg font-semibold text-ink truncate">{title}</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-ink-faint hover:text-ink transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
