import { useEffect, useRef, useState } from 'react'
import { Loader2, RotateCcw, AlertTriangle } from 'lucide-react'
import { buildInlinePreviewUrl, isNativePreview } from '../lib/previewUrl.js'

// Google's Document Viewer isn't a guaranteed, official API — it can be
// slow, time out fetching the source file, or throttle bursts of requests.
// An <iframe> doesn't reliably fire an error event when the page it loads
// fails internally (it still "loads", just shows Google's own error state),
// so a stuck spinner past this timeout is treated as a failure and offers
// a manual retry rather than spinning forever.
const LOAD_TIMEOUT_MS = 12000

export default function PDFViewer({ resourceType, url, title }) {
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const loadedRef = useRef(false)

  useEffect(() => {
    loadedRef.current = false
    setLoaded(false)
    setTimedOut(false)

    const timer = setTimeout(() => {
      if (!loadedRef.current) setTimedOut(true)
    }, LOAD_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [url, retryKey])

  const handleLoad = () => {
    loadedRef.current = true
    setLoaded(true)
  }

  const handleRetry = () => setRetryKey((k) => k + 1)

  if (isNativePreview(resourceType)) {
    return (
      <div className="relative h-full min-h-[420px] rounded-2xl border border-white/[0.07] bg-base-card/40 overflow-hidden flex items-center justify-center">
        {!loaded && <Loader2 size={20} className="absolute text-primary-light animate-spin" />}
        <img
          key={retryKey}
          src={url}
          alt={title}
          onLoad={handleLoad}
          className={`max-w-full max-h-full object-contain transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    )
  }

  if (timedOut) {
    return (
      <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center p-8 bg-base-card/40 rounded-2xl border border-white/[0.07]">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
          <AlertTriangle size={20} className="text-orange-400" />
        </div>
        <p className="text-sm text-ink">This preview is taking longer than expected.</p>
        <p className="mt-1.5 text-[13px] text-ink-muted max-w-xs">
          The preview service might be temporarily slow or unavailable. Try again, or download the
          file instead.
        </p>
        <button
          onClick={handleRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-4 py-2.5 text-sm font-medium text-white shadow-glow"
        >
          <RotateCcw size={15} />
          Retry
        </button>
      </div>
    )
  }

  // PDF, DOC, DOCX, PPT, PPTX all render through Google's document viewer —
  // it fetches the file server-side and serves its own embeddable page, so
  // the browser never requests the raw Cloudinary URL directly and can't be
  // redirected into a download by Cloudinary's response headers.
  const viewerUrl = buildInlinePreviewUrl(url, resourceType)

  return (
    <div className="relative h-full min-h-[420px] rounded-2xl border border-white/[0.07] bg-base-card/40 overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={20} className="text-primary-light animate-spin" />
        </div>
      )}
      <iframe
        key={retryKey}
        src={viewerUrl}
        title={title}
        onLoad={handleLoad}
        className={`w-full h-full min-h-[420px] transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
