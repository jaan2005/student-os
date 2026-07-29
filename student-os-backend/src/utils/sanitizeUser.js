import { MAX_MONTHLY_UPLOADS, DAILY_AI_CREDITS } from '../config/constants.js'

/**
 * Strips internal/Mongo-specific fields before sending a user doc to the client.
 */
export default function sanitizeUser(user) {
  return {
    id: user._id,
    email: user.email,
    provider: user.provider,
    firstName: user.firstName,
    lastName: user.lastName,
    college: user.college,
    branch: user.branch,
    semester: user.semester,
    profileCompleted: user.profileCompleted,
    role: user.role,
    canUploadCareer: user.canUploadCareer,
    monthlyUploadCount: user.monthlyUploadCount,
    monthlyUploadLimit: MAX_MONTHLY_UPLOADS,
    dailyCredits: user.dailyCredits,
    dailyCreditsLimit: DAILY_AI_CREDITS,
    createdAt: user.createdAt,
  }
}
