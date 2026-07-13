import sanitizeUser from '../utils/sanitizeUser.js'
import ensureMonthlyUploadWindow from '../utils/monthlyUploads.js'
import ensureDailyCreditWindow from '../utils/dailyCredits.js'
import { ALLOWED_COLLEGES } from '../config/constants.js'

const REQUIRED_FIELDS = ['firstName', 'lastName', 'college', 'branch', 'semester']

/**
 * GET /api/users/me
 * Returns the authenticated user's profile. Also doubles as the frontend's
 * "is my JWT still valid" check on app load / protected route entry.
 */
export async function getMe(req, res) {
  await ensureMonthlyUploadWindow(req.user)
  await ensureDailyCreditWindow(req.user)
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

  // Validated against the same allowlist the frontend dropdown offers — not
  // just trusted from the request body, so a direct API call can't set an
  // unrecognized college. Keeps college data clean from day one, which
  // matters once resources get college-scoped later (see ALLOWED_COLLEGES).
  if (!ALLOWED_COLLEGES.includes(college.trim())) {
    return res.status(400).json({ message: 'Select a valid college from the list.' })
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
