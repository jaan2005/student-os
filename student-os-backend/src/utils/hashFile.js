import crypto from 'crypto'

/**
 * Hashes raw file bytes with SHA-256. Used to detect duplicate uploads
 * before ever touching Cloudinary — see resourceController.uploadResource.
 */
export default function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}
