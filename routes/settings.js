import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { requireAdmin } from '../middleware/auth.js'
import Category from '../models/Category.js'
import DeliveryZone from '../models/DeliveryZone.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'mr-dough/categories', transformation: [{ width: 400, crop: 'limit', quality: 'auto' }] },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    )
    stream.end(buffer)
  })
}

/* ── Categories ── */
router.get('/categories', async (req, res) => {
  const cats = await Category.find({ isVisible: true }).sort({ sortOrder: 1 })
  res.json(cats)
})

// admin এর জন্য সব category (invisible সহ)
router.get('/categories/admin/all', requireAdmin, async (req, res) => {
  const cats = await Category.find().sort({ sortOrder: 1 })
  res.json(cats)
})

router.patch('/categories/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const cat = await Category.findOne({ id: req.params.id })
    if (!cat) return res.status(404).json({ error: 'Category পাওয়া যায়নি' })

    if (req.body.name !== undefined) cat.name = req.body.name
    if (req.body.icon !== undefined) cat.icon = req.body.icon
    if (req.file) cat.image = await uploadToCloudinary(req.file.buffer)

    await cat.save()
    res.json({ ok: true, cat })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── Delivery Zones ── */
router.get('/zones', async (req, res) => {
  const zones = await DeliveryZone.find({ isActive: true })
  res.json(zones)
})

// admin এর জন্য সব zone
router.get('/zones/admin/all', requireAdmin, async (req, res) => {
  const zones = await DeliveryZone.find()
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

router.delete('/zones/:id', requireAdmin, async (req, res) => {
  await DeliveryZone.deleteOne({ id: req.params.id })
  res.json({ ok: true })
})

export default router