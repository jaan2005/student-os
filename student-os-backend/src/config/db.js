import mongoose from 'mongoose'

export default async function connectDB() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error('Missing MONGODB_URI in environment variables.')
    process.exit(1)
  }

  try {
    mongoose.set('strictQuery', true)
    await mongoose.connect(uri)
    console.log('[db] MongoDB Atlas connected')
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message)
    process.exit(1)
  }
}
