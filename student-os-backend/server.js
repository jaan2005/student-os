import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import connectDB from './src/config/db.js'
import authRoutes from './src/routes/authRoutes.js'
import userRoutes from './src/routes/userRoutes.js'
import resourceRoutes from './src/routes/resourceRoutes.js'
import subjectRoutes from './src/routes/subjectRoutes.js'
import bookmarkRoutes from './src/routes/bookmarkRoutes.js'
import adminRoutes from './src/routes/adminRoutes.js'
import aiRoutes from './src/routes/aiRoutes.js'
import { notFound, errorHandler } from './src/middleware/errorHandler.js'

const app = express()

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)
app.use(express.json())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'student-os-backend' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/subjects', subjectRoutes)
app.use('/api/bookmarks', bookmarkRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/ai', aiRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] Student OS API running on port ${PORT}`)
  })
})
