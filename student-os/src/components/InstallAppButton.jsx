import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share, SquarePlus } from 'lucide-react'
import useInstallPrompt from '../hooks/useInstallPrompt.js'

export default function InstallAppButton({ className = '' }) {
  const { shouldShow, canInstall, showIOSInstructions, promptInstall } = useInstallPrompt()
  const [showIOSTip, setShowIOSTip] = useState(false)

  if (!shouldShow) return null

  const handleClick = () => {
    if (canInstall) promptInstall()
    else setShowIOSTip((v) => !v)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-colors px-3.5 py-2 text-sm text-ink"
      >
        <Download size={15} />
        Install App
      </button>

      <AnimatePresence>
        {showIOSInstructions && showIOSTip && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 rounded-xl glass shadow-glow-lg p-4 z-50"
          >
            <p className="text-xs text-ink-muted leading-relaxed">
              Tap <Share size={12} className="inline -mt-0.5 mx-0.5 text-primary-light" /> Share, then{' '}
              <SquarePlus size={12} className="inline -mt-0.5 mx-0.5 text-primary-light" />{' '}
              <span className="text-ink font-medium">Add to Home Screen</span>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
