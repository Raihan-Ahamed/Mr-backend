import mongoose from 'mongoose'

const menuItemSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  category: { type: String, required: true },
  name:     { type: String, required: true },
  desc:     { type: String, default: '' },
  caption:  { type: String, default: '' },       // extra tagline (নতুন ফিল্ড)
  image:    { type: String, default: '' },        // Cloudinary URL
  rating:   { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0 },
  // single price (burger, wings, etc.)
  price:    { type: Number, default: null },
  // size-based price (pizza, pasta, etc.)
  sizes: {
    reg: { type: Number, default: null },
    med: { type: Number, default: null },
    lar: { type: Number, default: null },
  },
  isAvailable:  { type: Boolean, default: true },
  isBestSeller: { type: Boolean, default: false },
  isSpecial:    { type: Boolean, default: false },
  sortOrder:    { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.model('MenuItem', menuItemSchema)
