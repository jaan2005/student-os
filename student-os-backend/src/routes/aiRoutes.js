import { Router } from 'express'
import authenticateJWT from '../middleware/authenticateJWT.js'
import aiRateLimiter, { aiAssistantRateLimiter } from '../middleware/rateLimiter.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { explain, summarize, quiz, getActiveConversation, startNewConversation, sendMessage } from '../controllers/aiController.js'

const router = Router()

router.use(authenticateJWT)

router.post('/explain', aiRateLimiter, asyncHandler(explain))
router.post('/summarize', aiRateLimiter, asyncHandler(summarize))
router.post('/quiz', aiRateLimiter, asyncHandler(quiz))

// AI Study Assistant — its own rate limiter (see rateLimiter.js), separate
// from the one-shot tools above.
router.get('/assistant/:resourceId', aiAssistantRateLimiter, asyncHandler(getActiveConversation))
router.post('/assistant/:resourceId/new', aiAssistantRateLimiter, asyncHandler(startNewConversation))
router.post('/assistant/:conversationId/message', aiAssistantRateLimiter, asyncHandler(sendMessage))

export default router
