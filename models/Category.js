import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  icon:      { type: String, default: '' },
  image:     { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Category', categorySchema)