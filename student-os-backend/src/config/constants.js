export const ROLES = {
  STUDENT: 'student',
  TRUSTED_CONTRIBUTOR: 'trustedContributor',
  ADMIN: 'admin',
}

export const ALL_ROLES = Object.values(ROLES)

// Roles allowed to upload resources (students cannot).
export const UPLOAD_ROLES = [ROLES.TRUSTED_CONTRIBUTOR, ROLES.ADMIN]

// Configurable via env rather than hardcoded — falls back to 10 if unset/invalid.
const parsedLimit = parseInt(process.env.MAX_MONTHLY_UPLOADS, 10)
export const MAX_MONTHLY_UPLOADS = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10

// Daily AI credit allowance, shared across Explain / Summarize / Quiz.
const parsedCredits = parseInt(process.env.DAILY_AI_CREDITS, 10)
export const DAILY_AI_CREDITS = Number.isFinite(parsedCredits) && parsedCredits > 0 ? parsedCredits : 10

// Cost per AI feature, in credits. A single constant object so adding a new
// AI feature later (Flashcards, Chat, ...) is a one-line addition here.
export const AI_CREDIT_COSTS = {
  explain: 1,
  summarize: 1,
  quiz: 1,
}

export const AI_LIMIT_REACHED_MESSAGE =
  "You have reached today's AI limit. Your credits will reset tomorrow."

// Safety net against a runaway client, script, or bug hammering the AI
// endpoints — separate from (and in addition to) the daily credit system.
// Credits limit how MUCH AI a student can use per day; this limits how FAST
// they can fire requests, protecting against cost spikes regardless of
// remaining credits. See middleware/rateLimiter.js.
const parsedRateMax = parseInt(process.env.AI_RATE_LIMIT_MAX, 10)
export const AI_RATE_LIMIT_MAX = Number.isFinite(parsedRateMax) && parsedRateMax > 0 ? parsedRateMax : 8

const parsedRateWindow = parseInt(process.env.AI_RATE_LIMIT_WINDOW_MINUTES, 10)
export const AI_RATE_LIMIT_WINDOW_MINUTES =
  Number.isFinite(parsedRateWindow) && parsedRateWindow > 0 ? parsedRateWindow : 1

// Caps how much text can be pasted into AI Explain — bounds the cost of a
// single request regardless of credit accounting.
const parsedExplainMax = parseInt(process.env.MAX_EXPLAIN_INPUT_CHARS, 10)
export const MAX_EXPLAIN_INPUT_CHARS =
  Number.isFinite(parsedExplainMax) && parsedExplainMax > 0 ? parsedExplainMax : 8000

// How many AI pre-generation jobs (triggered right after a PDF upload) run
// concurrently in this process. See utils/taskQueue.js.
const parsedPregenConcurrency = parseInt(process.env.AI_PREGEN_CONCURRENCY, 10)
export const AI_PREGEN_CONCURRENCY =
  Number.isFinite(parsedPregenConcurrency) && parsedPregenConcurrency > 0 ? parsedPregenConcurrency : 2

// V1: single college. When onboarding another college later, add it here —
// must stay in sync with COLLEGES in the frontend's src/constants/colleges.js.
// Validated server-side (not just via the frontend dropdown) so a direct API
// request can't set an arbitrary, unrecognized college.
//
// TODO: replace with your actual college name before launch.
export const ALLOWED_COLLEGES = ['M.H. Saboo Siddik College of Engineering']
