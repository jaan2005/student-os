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
  // Charged per message, not per conversation — see aiController.js. A
  // conversation of N messages costs N credits, same as clicking
  // Explain/Summarize/Quiz N separate times would.
  assistant: 1,
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

// The Assistant is a genuine back-and-forth (send, read, reply, read,
// reply...) — a normal study session can plausibly hit the one-shot
// Explain/Summarize/Quiz rate limit (8/min) without any abuse involved.
// Given its own, higher ceiling on the same underlying limiter rather than
// sharing aiRateLimiter as-is.
const parsedAssistantRateMax = parseInt(process.env.AI_ASSISTANT_RATE_LIMIT_MAX, 10)
export const AI_ASSISTANT_RATE_LIMIT_MAX =
  Number.isFinite(parsedAssistantRateMax) && parsedAssistantRateMax > 0 ? parsedAssistantRateMax : 20

const parsedAssistantRateWindow = parseInt(process.env.AI_ASSISTANT_RATE_LIMIT_WINDOW_MINUTES, 10)
export const AI_ASSISTANT_RATE_LIMIT_WINDOW_MINUTES =
  Number.isFinite(parsedAssistantRateWindow) && parsedAssistantRateWindow > 0 ? parsedAssistantRateWindow : 1

// Caps how much text can be pasted into AI Explain — bounds the cost of a
// single request regardless of credit accounting.
const parsedExplainMax = parseInt(process.env.MAX_EXPLAIN_INPUT_CHARS, 10)
export const MAX_EXPLAIN_INPUT_CHARS =
  Number.isFinite(parsedExplainMax) && parsedExplainMax > 0 ? parsedExplainMax : 8000

// AI Study Assistant: every message re-sends the document context plus the
// running conversation so far, so both need a hard cap or a long session
// against a long PDF eventually gets slow, expensive, or exceeds the
// model's context window. History is capped by message *count* (only the
// most recent N are sent, though all are stored and shown in the UI);
// document context is capped by *character count* (same idea as
// MAX_EXPLAIN_INPUT_CHARS, applied to the extracted PDF text instead).
const parsedAssistantHistory = parseInt(process.env.AI_ASSISTANT_HISTORY_LIMIT, 10)
export const AI_ASSISTANT_HISTORY_LIMIT =
  Number.isFinite(parsedAssistantHistory) && parsedAssistantHistory > 0 ? parsedAssistantHistory : 10

const parsedAssistantContext = parseInt(process.env.AI_ASSISTANT_CONTEXT_CHAR_LIMIT, 10)
export const AI_ASSISTANT_CONTEXT_CHAR_LIMIT =
  Number.isFinite(parsedAssistantContext) && parsedAssistantContext > 0 ? parsedAssistantContext : 60_000

// Hard cap on a single message's length — same purpose as
// MAX_EXPLAIN_INPUT_CHARS, applied to what a student types into the Assistant.
const parsedAssistantMessage = parseInt(process.env.MAX_ASSISTANT_MESSAGE_CHARS, 10)
export const MAX_ASSISTANT_MESSAGE_CHARS =
  Number.isFinite(parsedAssistantMessage) && parsedAssistantMessage > 0 ? parsedAssistantMessage : 4000

// How many AI pre-generation jobs (triggered right after a PDF upload) run
// concurrently in this process. See utils/taskQueue.js.
const parsedPregenConcurrency = parseInt(process.env.AI_PREGEN_CONCURRENCY, 10)
export const AI_PREGEN_CONCURRENCY =
  Number.isFinite(parsedPregenConcurrency) && parsedPregenConcurrency > 0 ? parsedPregenConcurrency : 2

// V2: multi-college. Every college a student can select in Profile Setup
// must be listed here — validated server-side (not just via the frontend
// dropdown) so a direct API request can't set an arbitrary, unrecognized
// college. Must stay in sync with COLLEGES in the frontend's
// src/constants/colleges.js. Academic resources are scoped to the
// uploader's/viewer's college; Career Resources are not (see RESOURCE_CATEGORIES).
export const ALLOWED_COLLEGES = [
  'M.H. Saboo Siddik College of Engineering',
  "Vivekanand Education Society's College of Pharmacy",
  "M.H SABOO SIDDIK POLYTECHNIC",
  "Ramniranjan Jhunjhunwala College of Arts, Science & Commerce",
]

// Two resource categories:
// - 'academic'  : Notes & Resources, scoped per-college (unchanged V1 behavior)
// - 'career'    : Career Resources, visible to every student regardless of
//                 college, but every upload starts 'pending' and only
//                 becomes visible once an admin approves it.
export const RESOURCE_CATEGORIES = {
  ACADEMIC: 'academic',
  CAREER: 'career',
}
export const ALL_RESOURCE_CATEGORIES = Object.values(RESOURCE_CATEGORIES)

export const APPROVAL_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
}
export const ALL_APPROVAL_STATUSES = Object.values(APPROVAL_STATUS)
