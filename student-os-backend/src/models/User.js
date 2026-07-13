import mongoose from 'mongoose'
import { ALL_ROLES, ROLES, DAILY_AI_CREDITS } from '../config/constants.js'

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['password', 'google'],
      default: 'password',
    },
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    college: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
    semester: { type: String, trim: true, default: '' },
    profileCompleted: { type: Boolean, default: false },

    role: { type: String, enum: ALL_ROLES, default: ROLES.STUDENT, index: true },

    // Resets to 0 whenever uploadResetDate falls in a previous calendar
    // month — see utils/monthlyUploads.js. Duplicate uploads (same
    // fileHash) never increment this.
    monthlyUploadCount: { type: Number, default: 0 },
    uploadResetDate: { type: Date, default: Date.now },

    // Resets to DAILY_AI_CREDITS whenever lastCreditReset falls on a
    // previous calendar day — see utils/dailyCredits.js. Shared across
    // Explain / Summarize / Quiz (and future AI features).
    dailyCredits: { type: Number, default: DAILY_AI_CREDITS },
    lastCreditReset: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
