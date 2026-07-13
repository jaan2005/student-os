import pdfParse from 'pdf-parse'

export class UnsupportedResourceTypeError extends Error {
  constructor(resourceType) {
    super(
      `AI summarization and full-document quizzes currently support PDF resources only (got "${resourceType}"). Try "Explain" with a manually entered topic instead.`
    )
    this.statusCode = 400
  }
}

/**
 * Returns the plain-text content of a resource, extracting and caching it
 * on first use. Only PDF is supported in V1 — DOC/DOCX/PPT/PPTX would need
 * a conversion step (e.g. LibreOffice) and JPG/PNG would need OCR, both out
 * of scope for this pass. `Explain` (manual topic entry) works for every
 * resource type regardless, since it doesn't depend on file content.
 *
 * Expects `resource` to have been fetched with `.select('+extractedText')`.
 */
export default async function getResourceText(resource) {
  if (resource.extractedText) {
    return resource.extractedText
  }

  if (resource.resourceType !== 'pdf') {
    throw new UnsupportedResourceTypeError(resource.resourceType)
  }

  const response = await fetch(resource.cloudinaryUrl)
  if (!response.ok) {
    const err = new Error('Could not fetch the file for text extraction.')
    err.statusCode = 502
    throw err
  }

  const arrayBuffer = await response.arrayBuffer()
  const { text } = await pdfParse(Buffer.from(arrayBuffer))

  const trimmed = text.trim()
  if (!trimmed) {
    const err = new Error(
      'No extractable text was found in this PDF (it may be a scanned image). AI summarization needs a text-based PDF.'
    )
    err.statusCode = 422
    throw err
  }

  resource.extractedText = trimmed
  await resource.save()

  return trimmed
}
