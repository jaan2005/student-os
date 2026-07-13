import User from '../models/User.js'
import { DAILY_AI_CREDITS } from '../config/constants.js'

/**
 * Resets dailyCredits to DAILY_AI_CREDITS if lastCreditReset falls on a
 * previous calendar day. Persists the reset immediately if one was needed.
 *
 * Called both in userController.getMe (so the count self-heals as soon as a
 * new day starts, even before the user's next AI request) and at the top of
 * every AI controller (explain/summarize/quiz), mirroring the same pattern
 * used for the monthly upload quota in utils/monthlyUploads.js.
 *
 * This function's own read-then-write is not perfectly race-proof under
 * concurrency, but that's fine here — the worst case is it resets to the
 * same fixed DAILY_AI_CREDITS value twice in a row, which is harmless (it's
 * a reset, not an increment). The credit *spend* path below is where a race
 * would actually let someone over-spend, so that's the one built to be
 * atomic.
 */
export default async function ensureDailyCreditWindow(user) {
  const now = new Date()
  const resetDate = user.lastCreditReset

  const sameDay =
    resetDate &&
    now.getFullYear() === resetDate.getFullYear() &&
    now.getMonth() === resetDate.getMonth() &&
    now.getDate() === resetDate.getDate()

  if (!sameDay) {
    user.dailyCredits = DAILY_AI_CREDITS
    user.lastCreditReset = now
    await user.save()
  }

  return user
}

/**
 * Atomically checks-and-deducts credits in one MongoDB operation, so two
 * near-simultaneous requests from the same user can't both read "I have
 * enough credits" before either write lands (the bug a plain
 * read-then-save() would have). The `dailyCredits: { $gte: cost }` filter
 * is enforced by MongoDB itself: if two requests race, at most one matches
 * and decrements; the other simply finds no matching document and gets
 * `null` back — meaning "insufficient credits," not "database error."
 *
 * Called BEFORE attempting the Gemini call (a reservation) — if the call
 * then fails, refundCredits() below gives it back, so the net effect still
 * satisfies "deduct only after a successful AI response."
 *
 * Returns the updated user doc (with the new dailyCredits already applied)
 * on success, or null if there weren't enough credits.
 */
export async function reserveCredits(userId, cost) {
  return User.findOneAndUpdate(
    { _id: userId, dailyCredits: { $gte: cost } },
    { $inc: { dailyCredits: -cost } },
    { new: true }
  )
}

/**
 * Compensating refund for a reservation whose AI call failed. Unconditional
 * (no $gte guard needed) since we're just giving back credits this same
 * request already took.
 */
export async function refundCredits(userId, cost) {
  await User.findOneAndUpdate({ _id: userId }, { $inc: { dailyCredits: cost } })
}
