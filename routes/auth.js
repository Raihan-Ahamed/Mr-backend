import express from 'express'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

const router = express.Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Email ও password দিন' })

    const admin = await Admin.findOne({ email })
    if (!admin || !(await admin.checkPassword(password)))
      return res.status(401).json({ error: 'Email অথবা password ভুল' })

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, name: admin.name, email: admin.email })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
