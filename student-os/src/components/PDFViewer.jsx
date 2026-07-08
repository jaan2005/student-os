import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { buildInlinePreviewUrl, isNativePreview } from '../lib/previewUrl.js'

export default function PDFViewer({ resourceType, url, title }) {
  const [loaded, setLoaded] = useState(false)

  if (isNativePreview(resourceType)) {
    return (
      <div className="relative h-full min-h-[420px] rounded-2xl border border-white/[0.07] bg-base-card/40 overflow-hidden flex items-center justify-center">
        {!loaded && <Loader2 size={20} className="absolute text-primary-light animate-spin" />}
        <img
          src={url}
          alt={title}
          onLoad={() => setLoaded(true)}
          className={`max-w-full max-h-full object-contain transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
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
        src={viewerUrl}
        title={title}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full min-h-[420px] transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
