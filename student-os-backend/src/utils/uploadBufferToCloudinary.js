import { Readable } from 'stream'
import cloudinary from '../config/cloudinary.js'

/**
 * Uploads an in-memory buffer (from Multer's memoryStorage) to Cloudinary
 * via a streamed upload — no temp files touch disk.
 */
export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'student-os/resources',
        use_filename: true,
        unique_filename: true,
        ...options,
      },
      (err, result) => {
        if (err) return reject(err)
        resolve(result)
      }
    )
    Readable.from(buffer).pipe(uploadStream)
  })
}
