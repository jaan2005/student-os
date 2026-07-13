import { useEffect, useState } from 'react'

const DISMISS_KEY = 'studentos_install_dismissed'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS Safari's own (non-standard) flag
  )
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

/**
 * Android/Chrome fires `beforeinstallprompt`, which this captures and defers
 * so a custom-styled button can trigger it later instead of relying on
 * Chrome's own address-bar icon. iOS Safari never fires that event at all
 * (Apple's deliberate choice) — there's no programmatic install there, only
 * a manual Share -> "Add to Home Screen" — so this exposes
 * `showIOSInstructions` for callers to render that guidance instead.
 */
export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(isStandalone())
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === 'true')

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  const canInstall = Boolean(deferredPrompt)
  const showIOSInstructions = isIOS() && !installed
  const shouldShow = !installed && !dismissed && (canInstall || showIOSInstructions)

  return { shouldShow, canInstall, showIOSInstructions, installed, promptInstall, dismiss }
}
