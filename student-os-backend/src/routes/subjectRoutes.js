import { Router } from 'express'
import authenticateJWT from '../middleware/authenticateJWT.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { getSubjects } from '../controllers/resourceController.js'

const router = Router()

router.get('/', authenticateJWT, asyncHandler(getSubjects))

export default router
