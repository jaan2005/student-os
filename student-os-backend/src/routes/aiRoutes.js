import { Router } from 'express'
import authenticateJWT from '../middleware/authenticateJWT.js'
import aiRateLimiter from '../middleware/rateLimiter.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { explain, summarize, quiz } from '../controllers/aiController.js'

const router = Router()

router.use(authenticateJWT)
router.use(aiRateLimiter)

router.post('/explain', asyncHandler(explain))
router.post('/summarize', asyncHandler(summarize))
router.post('/quiz', asyncHandler(quiz))

export default router
