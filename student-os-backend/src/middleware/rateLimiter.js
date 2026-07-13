import rateLimit from 'express-rate-limit'
import { AI_RATE_LIMIT_MAX, AI_RATE_LIMIT_WINDOW_MINUTES } from '../config/constants.js'

/**
 * Caps how FAST a user can fire AI requests, independent of the daily
 * credit system (which caps how MUCH they can use per day). This is what
 * protects against a runaway client bug or a script hammering the endpoint
 * faster than any real click ever would — the credit system alone doesn't
 * fully cover that, since a burst of near-simultaneous requests could still
 * rack up real Gemini costs before the credit count catches up.
 *
 * Keyed per-user (falls back to IP if somehow unauthenticated, though these
 * routes always run after authenticateJWT in practice).
 */
const aiRateLimiter = rateLimit({
  windowMs: AI_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      message: 'You are sending AI requests too quickly. Please wait a moment and try again.',
    })
  },
})

export default aiRateLimiter
