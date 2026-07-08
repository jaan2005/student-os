import jwt from 'jsonwebtoken'
import User from '../models/User.js'

/**
 * Protects routes using the backend-issued JWT (not the Firebase ID token).
 * Expects: Authorization: Bearer <jwt>
 */
export default async function authenticateJWT(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired session. Please sign in again.' })
    }

    const user = await User.findById(decoded.sub)
    if (!user) {
      return res.status(401).json({ message: 'Account no longer exists.' })
    }

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}
