import express from 'express'
import { requireAdmin } from '../middleware/auth.js'
import DeliveryZone from '../models/DeliveryZone.js'

const router = express.Router()

// GET সব zone (public)
router.get('/', async (req, res) => {
  try {
    const zones = await DeliveryZone.find({ isActive: true })
    res.json(zones)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET সব zone admin এর জন্য
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const zones = await DeliveryZone.find()
    res.json(zones)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST নতুন zone যোগ করো
router.post('/', requireAdmin, async (req, res) => {
  try {
    const zone = new DeliveryZone(req.body)
    await zone.save()
    res.status(201).json({ ok: true, zone })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH zone আপডেট (নাম/চার্জ)
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const zone = await DeliveryZone.findOne({ id: req.params.id })
    if (!zone) return res.status(404).json({ error: 'Zone পাওয়া যায়নি' })
    if (req.body.name !== undefined) zone.name = req.body.name
    if (req.body.charge !== undefined) zone.charge = Number(req.body.charge)
    if (req.body.isActive !== undefined) zone.isActive = req.body.isActive
    await zone.save()
    res.json({ ok: true, zone })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE zone মুছে ফেলো
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await DeliveryZone.deleteOne({ id: req.params.id })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router