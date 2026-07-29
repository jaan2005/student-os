import { Router } from 'express'
import authenticateJWT from '../middleware/authenticateJWT.js'
import authorizeRoles from '../middleware/authorizeRoles.js'
import asyncHandler from '../middleware/asyncHandler.js'
import { ROLES, APPROVAL_STATUS } from '../config/constants.js'
import {
  listUsers,
  updateUserRole,
  updateCareerAccess,
  listPendingCareerResources,
  reviewCareerResource,
} from '../controllers/adminController.js'

const router = Router()

router.use(authenticateJWT, authorizeRoles([ROLES.ADMIN], 'Admin access required.'))

router.get('/users', asyncHandler(listUsers))
router.patch('/users/:id/role', asyncHandler(updateUserRole))
router.patch('/users/:id/career-access', asyncHandler(updateCareerAccess))

router.get('/career-resources/pending', asyncHandler(listPendingCareerResources))
router.patch('/career-resources/:id/approve', asyncHandler(reviewCareerResource(APPROVAL_STATUS.APPROVED)))
router.patch('/career-resources/:id/reject', asyncHandler(reviewCareerResource(APPROVAL_STATUS.REJECTED)))

export default router
