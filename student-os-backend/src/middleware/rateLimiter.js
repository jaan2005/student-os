import rateLimit from 'express-rate-limit'
import {
  AI_RATE_LIMIT_MAX,
  AI_RATE_LIMIT_WINDOW_MINUTES,
  AI_ASSISTANT_RATE_LIMIT_MAX,
  AI_ASSISTANT_RATE_LIMIT_WINDOW_MINUTES,
} from '../config/constants.js'

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
function makeAiRateLimiter(max, windowMinutes) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    handler: (req, res) => {
      res.status(429).json({
        message: 'You are sending AI requests too quickly. Please wait a moment and try again.',
      })
    },
  })
}

const aiRateLimiter = makeAiRateLimiter(AI_RATE_LIMIT_MAX, AI_RATE_LIMIT_WINDOW_MINUTES)

// The Assistant is a real back-and-forth chat, not a one-shot click like
// Explain/Summarize/Quiz — a normal session (send, read, reply, read,
// reply...) can plausibly approach the one-shot limit without any abuse
// involved, so it gets its own, higher ceiling rather than sharing this one.
export const aiAssistantRateLimiter = makeAiRateLimiter(
  AI_ASSISTANT_RATE_LIMIT_MAX,
  AI_ASSISTANT_RATE_LIMIT_WINDOW_MINUTES
)

export default aiRateLimiter
