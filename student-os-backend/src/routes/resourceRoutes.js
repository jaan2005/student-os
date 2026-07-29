import { Router } from 'express'
import authenticateJWT from '../middleware/authenticateJWT.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { upload } from '../middleware/upload.js'
import {
  listResources,
  uploadResource,
  getResourceById,
  downloadResourceFile,
  updateResource,
  deleteResource,
} from '../controllers/resourceController.js'

const router = Router()

router.use(authenticateJWT)

router.get('/', asyncHandler(listResources))
// No blanket role gate here on purpose: 'academic' vs 'career' uploads are
// authorized by two different, independent permissions (UPLOAD_ROLES for
// academic, User.canUploadCareer for career — see authorizeUpload() in
// resourceController.js). `category` only arrives in the multipart body, so
// it isn't known until Multer parses the request — meaning an unauthorized
// user's file does get buffered into memory before the controller rejects
// them with a 403. That's an accepted, minor tradeoff (a small wasted
// buffer per rejected attempt), not a security gap: nothing is written to
// Cloudinary or MongoDB until authorization passes.
router.post('/upload', upload.single('file'), asyncHandler(uploadResource))
router.get('/:id', asyncHandler(getResourceById))
router.get('/:id/download', asyncHandler(downloadResourceFile))
router.put('/:id', asyncHandler(updateResource))
router.delete('/:id', asyncHandler(deleteResource))

export default router
