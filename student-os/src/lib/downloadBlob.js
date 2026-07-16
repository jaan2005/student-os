/**
 * Used with the resource download endpoint, which returns the file as a
 * Blob (not a URL) so the request can carry our normal Authorization
 * header — a plain `window.open(url)` can't attach custom headers, which is
 * exactly why this goes through an authenticated fetch instead of a direct
 * Cloudinary URL.
 */
export default function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || 'download'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
