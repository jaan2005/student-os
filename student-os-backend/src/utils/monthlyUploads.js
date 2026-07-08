/**
 * Resets monthlyUploadCount to 0 if uploadResetDate falls in a previous
 * calendar month. Persists the reset immediately if one was needed.
 *
 * Called both in userController.getMe (so the count self-heals as soon as
 * a new month starts, even before the user's next upload attempt) and at
 * the top of resourceController.uploadResource (so the limit check below
 * it is always working with a correctly-windowed count).
 */
export default async function ensureMonthlyUploadWindow(user) {
  const now = new Date()
  const resetDate = user.uploadResetDate

  const sameMonth =
    resetDate && now.getFullYear() === resetDate.getFullYear() && now.getMonth() === resetDate.getMonth()

  if (!sameMonth) {
    user.monthlyUploadCount = 0
    user.uploadResetDate = now
    await user.save()
  }

  return user
}
