import admin from '../config/firebaseAdmin.js'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'
import sanitizeUser from '../utils/sanitizeUser.js'

/**
 * POST /api/auth/sync
 *
 * Called after any successful Firebase sign-in (email/password signup,
 * email/password login, or Google popup). The frontend sends the Firebase
 * ID token; this endpoint verifies it server-side, finds-or-creates the
 * matching MongoDB user, and issues the backend's own JWT.
 *
 * Body: { idToken: string }
 * Returns: { token, isNewUser, user }
 */
export async function syncUser(req, res) {
  const { idToken } = req.body

  if (!idToken) {
    return res.status(400).json({ message: 'idToken is required.' })
  }

  let decodedToken
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken)
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired Firebase token.' })
  }

  const { uid, email, firebase } = decodedToken

  if (!email) {
    return res.status(400).json({ message: 'This Firebase account has no email on file.' })
  }

  const provider = firebase?.sign_in_provider === 'google.com' ? 'google' : 'password'

  let user = await User.findOne({ firebaseUid: uid })
  let isNewUser = false

  if (!user) {
    // Handles the edge case where a user first signed up with email/password
    // and later links the same email via Google (or vice versa).
    user = await User.findOne({ email: email.toLowerCase() })

    if (user) {
      user.firebaseUid = uid
      await user.save()
    } else {
      user = await User.create({ firebaseUid: uid, email, provider })
      isNewUser = true
    }
  }

  const token = generateToken(user)

  res.status(200).json({
    token,
    isNewUser,
    user: sanitizeUser(user),
  })
}
