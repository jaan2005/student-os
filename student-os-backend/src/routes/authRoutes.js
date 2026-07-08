import { Router } from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { syncUser } from '../controllers/authController.js'

const router = Router()

router.post('/sync', asyncHandler(syncUser))

export default router
