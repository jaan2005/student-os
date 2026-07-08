import multer from 'multer'

export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

const DUPLICATE_KEY_MESSAGES = {
  email: 'An account with this email already exists.',
  firebaseUid: 'An account with this email already exists.',
  fileHash: 'This file has already been uploaded.',
  'user_1_resource_1': 'You already bookmarked this resource.',
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[error]', err)

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'This file exceeds the maximum upload size of 20 MB.' })
    }
    return res.status(400).json({ message: err.message })
  }

  if (err.code === 11000) {
    const key = Object.keys(err.keyPattern || {})[0]
    return res.status(409).json({ message: DUPLICATE_KEY_MESSAGES[key] || 'This record already exists.' })
  }

  const status = err.statusCode || 500
  res.status(status).json({ message: err.message || 'Something went wrong on our end.' })
}
