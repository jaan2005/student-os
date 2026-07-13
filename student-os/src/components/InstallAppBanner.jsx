import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Share, SquarePlus } from 'lucide-react'
import useInstallPrompt from '../hooks/useInstallPrompt.js'

export default function InstallAppBanner() {
  const { shouldShow, canInstall, showIOSInstructions, promptInstall, dismiss } = useInstallPrompt()
  const [showIOSTip, setShowIOSTip] = useState(false)

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="rounded-2xl glass shadow-card p-4 sm:p-5 mb-8 flex items-start sm:items-center gap-4">
            <span className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Download size={17} className="text-primary-light" />
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">Install Student OS on your phone</p>
              {canInstall ? (
                <p className="text-[13px] text-ink-muted mt-0.5">
                  Get a home-screen icon and skip the browser tab next time.
                </p>
              ) : showIOSInstructions && showIOSTip ? (
                <p className="text-[13px] text-ink-muted mt-1 leading-relaxed">
                  Tap <Share size={12} className="inline -mt-0.5 mx-0.5 text-primary-light" /> Share, then{' '}
                  <SquarePlus size={12} className="inline -mt-0.5 mx-0.5 text-primary-light" />{' '}
                  <span className="text-ink font-medium">Add to Home Screen</span>.
                </p>
              ) : (
                <p className="text-[13px] text-ink-muted mt-0.5">
                  Get a home-screen icon and skip the browser tab next time.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => (canInstall ? promptInstall() : setShowIOSTip((v) => !v))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-3.5 py-2 text-xs font-medium text-white shadow-glow"
              >
                <Download size={13} />
                Install
              </button>
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="text-ink-faint hover:text-ink-muted transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
