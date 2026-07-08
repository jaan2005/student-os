import jwt from 'jsonwebtoken'

/**
 * Issues the backend's own session JWT. This is separate from the Firebase
 * ID token — Firebase authenticates the user once during sign-in/sign-up,
 * and this JWT is what the SPA uses for every subsequent API call.
 */
export default function generateToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}
