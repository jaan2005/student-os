import mongoose from 'mongoose'

/**
 * One conversation = one chat thread between a user and a resource's AI
 * Study Assistant. Unlike Summary/Quiz (shared across every student who
 * opens a resource), a conversation is private and personal — see
 * Message.js for why messages live in their own collection.
 *
 * Only one conversation is ever 'active' per (user, resource) at a time.
 * "New Chat" in the UI archives the current one and creates a fresh
 * 'active' conversation rather than deleting history — cheap to support
 * multiple past threads later (e.g. a thread picker) even though V1's UI
 * only ever surfaces the latest active one.
 */
const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// The query this whole feature runs on every page load: "give me this
// user's active conversation for this resource."
conversationSchema.index({ user: 1, resource: 1, status: 1 })

export default mongoose.model('Conversation', conversationSchema)
