import multer from 'multer'

// Maps accepted MIME types to the canonical resourceType stored on the
// Resource document. Anything not in this map is rejected outright — this
// is what keeps zip/rar/apk/exe/iso/mp4/mov out, without relying on the
// client's (spoofable) declared type.
export const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    const err = new Error('Unsupported file type. Allowed types: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG.')
    err.statusCode = 400
    return cb(err)
  }
  cb(null, true)
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
})
