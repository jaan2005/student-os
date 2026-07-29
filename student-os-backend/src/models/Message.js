import mongoose from 'mongoose'

/**
 * A single turn in a Conversation. Kept as its own collection (not embedded
 * as an array on Conversation) so that reading only the most recent N
 * messages — both for the context window sent to Gemini
 * (AI_ASSISTANT_HISTORY_LIMIT) and for paginating a long thread in the UI —
 * is a plain `.find().sort().limit()`, not an in-memory slice of a document
 * that keeps growing. Same "small, focused collection" shape as Bookmark.
 */
const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
)

messageSchema.index({ conversation: 1, createdAt: 1 })

export default mongoose.model('Message', messageSchema)
