/**
 * Restricts a route to specific roles. Always used alongside
 * authenticateJWT (which sets req.user), never as a substitute for it —
 * this checks *authorization*, not *authentication*.
 *
 * Usage: router.post('/upload', authenticateJWT, authorizeRoles(UPLOAD_ROLES, 'You are not authorized to upload resources.'), ...)
 */
export default function authorizeRoles(allowedRoles, message = 'You do not have permission to perform this action.') {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message })
    }
    next()
  }
}
