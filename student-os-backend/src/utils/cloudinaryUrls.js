/**
 * Cloudinary's `raw` resource type (used for PDF/DOC/PPT — see
 * cloudinaryResourceType.js) defaults delivery to
 * `Content-Disposition: attachment`, which makes the browser download the
 * file the instant anything requests that URL — including an <iframe>
 * trying to preview it. This inserts the `fl_attachment:false` delivery
 * flag into an already-known-good stored URL, producing a second URL that
 * renders inline instead.
 */
export function toInlinePreviewUrl(cloudinaryUrl) {
  if (!cloudinaryUrl) return cloudinaryUrl
  return cloudinaryUrl.replace('/upload/', '/upload/fl_attachment:false/')
}

/**
 * Downloading the plain `cloudinaryUrl` directly relies on Cloudinary's
 * *default* attachment behavior, which reports the filename as the raw
 * SHA-256 `public_id` (e.g. `a3f92e...d81`) with no explicit
 * Content-Disposition filename. Desktop browsers are generally forgiving
 * and infer `.pdf` from the URL path anyway, but Android's download manager
 * leans more heavily on the actual Content-Disposition header — with none
 * given, it can save the file without a recognizable name/extension, which
 * is what "it downloads but nothing can open it" looks like.
 *
 * `fl_attachment:<filename>` makes Cloudinary set an explicit
 * Content-Disposition with a real filename. IMPORTANT: unlike some other
 * Cloudinary transformations, this does NOT auto-append the correct file
 * extension if you omit it — the filename passed in here must already
 * include the real extension (e.g. "Lecture Notes.pdf"), or the downloaded
 * file lands with no extension at all. That was a real bug in an earlier
 * version of this function (it stripped the extension, assuming Cloudinary
 * would re-add it) — the visible symptom was Android receiving an
 * extensionless file and guessing the wrong file type entirely
 * (misidentifying it as a 3D/AR model and prompting to install "Google Play
 * Services for AR").
 */
export function toDownloadUrl(cloudinaryUrl, fileName) {
  if (!cloudinaryUrl) return cloudinaryUrl

  const safeName = encodeURIComponent(fileName || 'download')

  return cloudinaryUrl.replace('/upload/', `/upload/fl_attachment:${safeName}/`)
}
