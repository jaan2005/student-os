import mongoose from 'mongoose'
import { RESOURCE_CATEGORIES, ALL_RESOURCE_CATEGORIES, APPROVAL_STATUS, ALL_APPROVAL_STATUSES } from '../config/constants.js'

export const RESOURCE_TYPES = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'png']

const resourceSchema = new mongoose.Schema(
  {
    // 'academic' (Notes & Resources, scoped to `college`) or 'career'
    // (Career Resources, visible across every college, approval-gated).
    category: { type: String, enum: ALL_RESOURCE_CATEGORIES, default: RESOURCE_CATEGORIES.ACADEMIC, index: true },

    // Set for 'academic' resources (the uploader's college at upload time);
    // null for 'career' resources, which are intentionally cross-college.
    // Every academic list/search/subject query filters on this — see
    // resourceController.js.
    college: { type: String, trim: true, default: null, index: true },

    // Only meaningful for category: 'career'. Academic resources are always
    // 'approved' (unchanged V1 behavior — no moderation step for notes).
    // A career upload starts 'pending' and is invisible to everyone except
    // its uploader and admins until an admin approves it.
    approvalStatus: { type: String, enum: ALL_APPROVAL_STATUSES, default: APPROVAL_STATUS.APPROVED, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },

    // Subject-wise organization: Semester -> Subject -> (Unit / Topic as metadata)
    // Required for 'academic' resources; not used by 'career' resources
    // (see uploadResource — validation branches on category).
    semester: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    unit: { type: String, trim: true, default: '' },
    topic: { type: String, trim: true, default: '' },

    tags: [{ type: String, trim: true, lowercase: true }],
    resourceType: { type: String, enum: RESOURCE_TYPES, required: true },

    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true }, // bytes
    // SHA-256 of the raw file bytes. Unique index guarantees no duplicate
    // upload survives even under concurrent requests (see uploadResource).
    fileHash: { type: String, required: true, unique: true },

    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    downloads: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 }, // cached count; source of truth is the Bookmark collection

    // Cached plain-text extraction of the file, used by AI Summarize and
    // AI Quiz (entire-PDF mode) so the file isn't re-fetched and re-parsed
    // on every request. `select: false` keeps it out of normal resource
    // queries/responses — only pulled in explicitly via .select('+extractedText')
    // in the AI controller. Populated lazily on first use, PDF only in V1
    // (see utils/extractResourceText.js).
    extractedText: { type: String, select: false, default: '' },

    // Pre-generated AI Summary and whole-PDF Quiz, produced automatically in
    // the background right after a PDF upload (see utils/pregenerateResourceAI.js).
    // Serving these is then a plain MongoDB read with no Gemini call on the
    // request path — the whole point being that 100+ students opening the
    // same file during exam week never all hit the AI provider at once.
    // `select: false` for the same reason as extractedText; only pulled in
    // via .select('+aiSummaryCache'/'+aiQuizCache') where actually needed.
    aiPregenStatus: {
      type: String,
      enum: ['pending', 'ready', 'unsupported', 'failed'],
      default: 'pending',
    },
    aiSummaryCache: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
    aiQuizCache: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
    aiPregenAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Instant filtering across the fields listed in the spec's Search section.
resourceSchema.index({
  title: 'text',
  description: 'text',
  subject: 'text',
  unit: 'text',
  topic: 'text',
  tags: 'text',
})

// Fast folder-card aggregation (Semester -> Subject) and subject-page listing.
// Scoped per-college, so college leads the compound index.
resourceSchema.index({ college: 1, semester: 1, subject: 1 })
resourceSchema.index({ createdAt: -1 })

// Career Resources: the two query shapes that matter are "everyone browsing
// approved career resources" and "admin's pending-approval queue" — both
// filter on category first, then approvalStatus.
resourceSchema.index({ category: 1, approvalStatus: 1, createdAt: -1 })

export default mongoose.model('Resource', resourceSchema)
