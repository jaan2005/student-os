/**
 * Express 4 does not catch rejected promises from async route handlers on
 * its own — an unhandled rejection here would hang the request instead of
 * reaching errorHandler. Wrapping every async controller in this closes
 * that gap.
 */
export default function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
