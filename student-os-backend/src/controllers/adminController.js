import User from '../models/User.js'
import Resource from '../models/Resource.js'
import sanitizeUser from '../utils/sanitizeUser.js'
import { sanitizeResource } from '../utils/resourceHelpers.js'
import { ALL_ROLES, RESOURCE_CATEGORIES, APPROVAL_STATUS } from '../config/constants.js'

/**
 * GET /api/admin/users?search=...
 * Simple substring match against email/firstName/lastName.
 */
export async function listUsers(req, res) {
  const { search } = req.query
  const query = {}

  if (search?.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    query.$or = [{ email: regex }, { firstName: regex }, { lastName: regex }]
  }

  const users = await User.find(query).sort({ createdAt: -1 })
  res.status(200).json({ users: users.map(sanitizeUser) })
}

/**
 * PATCH /api/admin/users/:id/role
 * Body: { role: 'student' | 'trustedContributor' | 'admin' }
 */
export async function updateUserRole(req, res) {
  const { role } = req.body

  if (!ALL_ROLES.includes(role)) {
    return res.status(400).json({ message: `Role must be one of: ${ALL_ROLES.join(', ')}.` })
  }

  if (req.params.id === req.user._id.toString() && role !== req.user.role) {
    return res.status(400).json({ message: 'You cannot change your own role.' })
  }

  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found.' })

  user.role = role
  await user.save()

  res.status(200).json({ user: sanitizeUser(user) })
}

/**
 * PATCH /api/admin/users/:id/career-access
 * Body: { canUploadCareer: boolean }
 *
 * Independent of `role` on purpose — see User model comment. Grants or
 * revokes a specific user's ability to upload Career Resources without
 * touching their academic trustedContributor status either way.
 */
export async function updateCareerAccess(req, res) {
  const { canUploadCareer } = req.body

  if (typeof canUploadCareer !== 'boolean') {
    return res.status(400).json({ message: 'canUploadCareer must be a boolean.' })
  }

  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found.' })

  user.canUploadCareer = canUploadCareer
  await user.save()

  res.status(200).json({ user: sanitizeUser(user) })
}

/**
 * GET /api/admin/career-resources/pending
 * The approval queue: every Career Resource still awaiting a decision,
 * oldest first (so nothing sits ignored while newer uploads jump the
 * queue). Deliberately a separate endpoint from GET /api/resources rather
 * than a query param on it — keeps "show me unapproved content" from ever
 * being reachable by anything but the admin-only route guard.
 */
export async function listPendingCareerResources(req, res) {
  const resources = await Resource.find({
    category: RESOURCE_CATEGORIES.CAREER,
    approvalStatus: APPROVAL_STATUS.PENDING,
  })
    .populate('uploadedBy', 'firstName lastName')
    .sort({ createdAt: 1 })

  res.status(200).json({ resources: resources.map((r) => sanitizeResource(r)) })
}

/**
 * PATCH /api/admin/career-resources/:id/approve
 * PATCH /api/admin/career-resources/:id/reject
 * Shared handler — `nextStatus` is bound per-route in adminRoutes.js.
 */
export function reviewCareerResource(nextStatus) {
  return async function (req, res) {
    const resource = await Resource.findById(req.params.id)
    if (!resource) return res.status(404).json({ message: 'Resource not found.' })
    if (resource.category !== RESOURCE_CATEGORIES.CAREER) {
      return res.status(400).json({ message: 'This endpoint only reviews Career Resources.' })
    }

    resource.approvalStatus = nextStatus
    await resource.save()
    await resource.populate('uploadedBy', 'firstName lastName')

    res.status(200).json({ resource: sanitizeResource(resource) })
  }
}
