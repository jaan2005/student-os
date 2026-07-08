import { Router } from 'express'
import authenticateJWT from '../middleware/authenticateJWT.js'
import authorizeRoles from '../middleware/authorizeRoles.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { upload } from '../middleware/upload.js'
import { UPLOAD_ROLES } from '../config/constants.js'
import {
  listResources,
  uploadResource,
  getResourceById,
  updateResource,
  deleteResource,
} from '../controllers/resourceController.js'

const router = Router()

router.use(authenticateJWT)

router.get('/', asyncHandler(listResources))
router.post(
  '/upload',
  authorizeRoles(UPLOAD_ROLES, 'You are not authorized to upload resources.'),
  upload.single('file'),
  asyncHandler(uploadResource)
)
router.get('/:id', asyncHandler(getResourceById))
router.put('/:id', asyncHandler(updateResource))
router.delete('/:id', asyncHandler(deleteResource))

export default router
