import { Router } from 'express'
import authenticateJWT from '../middleware/authenticateJWT.js'
import authorizeRoles from '../middleware/authorizeRoles.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { ROLES } from '../config/constants.js'
import { listUsers, updateUserRole } from '../controllers/adminController.js'

const router = Router()

router.use(authenticateJWT, authorizeRoles([ROLES.ADMIN], 'Admin access required.'))

router.get('/users', asyncHandler(listUsers))
router.patch('/users/:id/role', asyncHandler(updateUserRole))

export default router
