import express from 'express'
import Rider from '../models/Rider.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

/* সব riders */
router.get('/', requireAdmin, async (req, res) => {
  const riders = await Rider.find().sort({ name: 1 })
  res.json(riders)
})

/* নতুন rider যোগ করো */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, phone, telegramId } = req.body
    if (!name || !telegramId)
      return res.status(400).json({ error: 'নাম ও Telegram ID দিন' })
    const rider = await Rider.create({ name, phone, telegramId })
    res.status(201).json({ ok: true, rider })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* Rider info আপডেট */
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const rider = await Rider.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json({ ok: true, rider })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* Rider মুছে ফেলো */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Rider.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
