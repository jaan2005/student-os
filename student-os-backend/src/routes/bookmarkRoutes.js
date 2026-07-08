import { Router } from 'express'
import authenticateJWT from '../middleware/authenticateJWT.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { listBookmarks, addBookmark, removeBookmark } from '../controllers/bookmarkController.js'

const router = Router()

router.use(authenticateJWT)

router.get('/', asyncHandler(listBookmarks))
router.post('/:id', asyncHandler(addBookmark))
router.delete('/:id', asyncHandler(removeBookmark))

export default router
