import mongoose from 'mongoose'

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },
  },
  { timestamps: true }
)

// A user can only bookmark a given resource once.
bookmarkSchema.index({ user: 1, resource: 1 }, { unique: true })

export default mongoose.model('Bookmark', bookmarkSchema)
