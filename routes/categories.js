import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { requireAdmin } from '../middleware/auth.js'
import Category from '../models/Category.js'

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

// GET সব category (public — frontend ব্যবহার করবে)
router.get('/', async (req, res) => {
  try {
    const cats = await Category.find({ isVisible: true }).sort({ sortOrder: 1 })
    res.json(cats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET সব category admin এর জন্য (invisible সহ)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const cats = await Category.find().sort({ sortOrder: 1 })
    res.json(cats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH category আপডেট (নাম/ছবি/আইকন)
router.patch('/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const cat = await Category.findOne({ id: req.params.id })
    if (!cat) return res.status(404).json({ error: 'Category পাওয়া যায়নি' })

    if (req.body.name !== undefined) cat.name = req.body.name
    if (req.body.icon !== undefined) cat.icon = req.body.icon
    if (req.body.isVisible !== undefined) cat.isVisible = req.body.isVisible
    if (req.file) cat.image = await uploadToCloudinary(req.file.buffer)

    await cat.save()
    res.json({ ok: true, category: cat })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router