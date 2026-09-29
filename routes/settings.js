import express from 'express'
import { requireAdmin } from '../middleware/auth.js'
import Category from '../models/Category.js'
import DeliveryZone from '../models/DeliveryZone.js'

const router = express.Router()

/* ── Categories ── */
router.get('/categories', async (req, res) => {
  const cats = await Category.find({ isVisible: true }).sort({ sortOrder: 1 })
  res.json(cats)
})

router.patch('/categories/:id', requireAdmin, async (req, res) => {
  const cat = await Category.findOneAndUpdate(
    { id: req.params.id }, req.body, { new: true }
  )
  res.json({ ok: true, cat })
})

/* ── Delivery Zones ── */
router.get('/zones', async (req, res) => {
  const zones = await DeliveryZone.find({ isActive: true })
  res.json(zones)
})

router.patch('/zones/:id', requireAdmin, async (req, res) => {
  const zone = await DeliveryZone.findOneAndUpdate(
    { id: req.params.id }, req.body, { new: true }
  )
  res.json({ ok: true, zone })
})

router.post('/zones', requireAdmin, async (req, res) => {
  const zone = new DeliveryZone(req.body)
  await zone.save()
  res.status(201).json({ ok: true, zone })
})

export default router
