import { Router } from 'express'
import authenticateJWT from '../middleware/authenticateJWT.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { getMe, updateProfile } from '../controllers/userController.js'

const router = Router()

router.get('/me', authenticateJWT, asyncHandler(getMe))
router.put('/profile', authenticateJWT, asyncHandler(updateProfile))

export default router
