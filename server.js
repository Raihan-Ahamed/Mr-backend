import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'

import authRoutes     from './routes/auth.js'
import menuRoutes     from './routes/menu.js'
import settingsRoutes from './routes/settings.js'
import orderRoutes    from './routes/orders.js'
import riderRoutes    from './routes/riders.js'

/* ── Cloudinary config ── */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/* ── Express setup ── */
const app = express()
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

/* ── Routes ── */
app.use('/api/auth',     authRoutes)
app.use('/api/menu',     menuRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/orders',   orderRoutes)
app.use('/api/riders',   riderRoutes)

app.get('/', (_req, res) => res.json({ status: 'Mr. Dough API running 🍕' }))
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'mr-dough-admin.html'))
})

/* ── MongoDB + Start ── */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`))
  })
  .catch(err => { console.error('MongoDB error:', err); process.exit(1) })
