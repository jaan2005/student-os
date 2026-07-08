const NATIVE_PREVIEW_TYPES = ['jpg', 'png']

/**
 * Images render natively via <img>. Everything else (PDF, DOC, DOCX, PPT,
 * PPTX) is wrapped in Google's document viewer, which fetches the file
 * server-side and renders its own embeddable HTML — this sidesteps
 * Cloudinary's Content-Type/Content-Disposition behavior entirely, since
 * the end user's browser never requests the raw file URL directly.
 */
export function buildInlinePreviewUrl(url, resourceType) {
  if (!url) return url
  if (NATIVE_PREVIEW_TYPES.includes(resourceType)) return url
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
}

export function isNativePreview(resourceType) {
  return NATIVE_PREVIEW_TYPES.includes(resourceType)
}
