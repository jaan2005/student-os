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

// NOTE: there used to be a toDownloadUrl() here, using Cloudinary's
// fl_attachment:<filename> transformation flag to set a proper downloaded
// filename. It's gone — Cloudinary's URL parser rejects a filename
// containing a literal "." with an HTTP 400 (confirmed live: a URL like
// `fl_attachment:Unit 1.pdf` fails; there wasn't enough confidence in the
// exact escaping rules to keep guessing at a fix after that). Downloads are
// now handled by a dedicated backend route instead
// (resourceController.downloadResourceFile / GET /api/resources/:id/download),
// which fetches the file and sets Content-Type/Content-Disposition itself —
// full control, no dependency on Cloudinary's transformation syntax at all.
