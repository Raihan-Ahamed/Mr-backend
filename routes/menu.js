import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { requireAdmin } from '../middleware/auth.js'
import MenuItem from '../models/MenuItem.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

/* ── Cloudinary helper ── */
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'mr-dough/menu', transformation: [{ width: 800, crop: 'limit', quality: 'auto' }] },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    )
    stream.end(buffer)
  })
}

/* ─────────────────────────────────────────────
   PUBLIC: frontend ব্যবহার করবে
───────────────────────────────────────────── */

// GET /api/menu  — সব active item
router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    const filter = { isAvailable: true }
    if (category) filter.category = category
    const items = await MenuItem.find(filter).sort({ category: 1, sortOrder: 1, id: 1 })
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ─────────────────────────────────────────────
   ADMIN: সব item (unavailable সহ)
───────────────────────────────────────────── */
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ category: 1, sortOrder: 1, id: 1 })
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ─────────────────────────────────────────────
   একটি item আপডেট (price / name / desc / caption / rating / image / availability)
───────────────────────────────────────────── */
router.patch('/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const item = await MenuItem.findOne({ id: req.params.id })
    if (!item) return res.status(404).json({ error: 'Item পাওয়া যায়নি' })

    // Text fields
    const fields = ['name', 'desc', 'caption', 'rating', 'ratingCount',
                    'isAvailable', 'isBestSeller', 'isSpecial', 'sortOrder']
    fields.forEach(f => { if (req.body[f] !== undefined) item[f] = req.body[f] })

    // Price fields
    if (req.body.price !== undefined)      item.price = Number(req.body.price) || null
    if (req.body['sizes.reg'] !== undefined) item.sizes.reg = Number(req.body['sizes.reg']) || null
    if (req.body['sizes.med'] !== undefined) item.sizes.med = Number(req.body['sizes.med']) || null
    if (req.body['sizes.lar'] !== undefined) item.sizes.lar = Number(req.body['sizes.lar']) || null

    // JSON body থেকে sizes object
    if (req.body.sizes && typeof req.body.sizes === 'object') {
      item.sizes = { ...item.sizes.toObject?.() ?? item.sizes, ...req.body.sizes }
    }

    // Image upload to Cloudinary
    if (req.file) {
      item.image = await uploadToCloudinary(req.file.buffer)
    }

    await item.save()
    res.json({ ok: true, item })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ─────────────────────────────────────────────
   নতুন item যোগ করো
───────────────────────────────────────────── */
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body }
    if (req.file) {
      data.image = await uploadToCloudinary(req.file.buffer)
    }
    if (data.sizes && typeof data.sizes === 'string') {
      data.sizes = JSON.parse(data.sizes)
    }
    const item = new MenuItem(data)
    await item.save()
    res.status(201).json({ ok: true, item })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ─────────────────────────────────────────────
   Item মুছে ফেলো
───────────────────────────────────────────── */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await MenuItem.deleteOne({ id: req.params.id })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
