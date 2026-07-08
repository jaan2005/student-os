/**
 * Cloudinary's `raw` resource type (used for PDF/DOC/PPT — see
 * cloudinaryResourceType.js) defaults delivery to
 * `Content-Disposition: attachment`, which makes the browser download the
 * file the instant anything requests that URL — including an <iframe>
 * trying to preview it. This inserts the `fl_attachment:false` delivery
 * flag into an already-known-good stored URL, producing a second URL that
 * renders inline instead.
 *
 * Downloads intentionally keep using the original, unmodified
 * `cloudinaryUrl` — that's the one place we *want* attachment behavior.
 */
export function toInlinePreviewUrl(cloudinaryUrl) {
  if (!cloudinaryUrl) return cloudinaryUrl
  return cloudinaryUrl.replace('/upload/', '/upload/fl_attachment:false/')
}
