import User from '../models/User.js'
import sanitizeUser from '../utils/sanitizeUser.js'
import { ALL_ROLES } from '../config/constants.js'

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
