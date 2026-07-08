import sanitizeUser from '../utils/sanitizeUser.js'
import ensureMonthlyUploadWindow from '../utils/monthlyUploads.js'

const REQUIRED_FIELDS = ['firstName', 'lastName', 'college', 'branch', 'semester']

/**
 * GET /api/users/me
 * Returns the authenticated user's profile. Also doubles as the frontend's
 * "is my JWT still valid" check on app load / protected route entry.
 */
export async function getMe(req, res) {
  await ensureMonthlyUploadWindow(req.user)
  res.status(200).json({ user: sanitizeUser(req.user) })
}

/**
 * PUT /api/users/profile
 * Saves the Profile Setup form and marks the account as complete.
 */
export async function updateProfile(req, res) {
  const { firstName, lastName, college, branch, semester } = req.body

  const missing = REQUIRED_FIELDS.filter((field) => !req.body[field]?.toString().trim())
  if (missing.length) {
    return res.status(400).json({ message: `Missing required field(s): ${missing.join(', ')}` })
  }

  const user = req.user
  user.firstName = firstName.trim()
  user.lastName = lastName.trim()
  user.college = college.trim()
  user.branch = branch.trim()
  user.semester = semester.trim()
  user.profileCompleted = true

  await user.save()

  res.status(200).json({ user: sanitizeUser(user) })
}
