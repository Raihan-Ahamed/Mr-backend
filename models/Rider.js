import mongoose from 'mongoose'

const riderSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  phone:     { type: String, default: '' },
  telegramId:{ type: String, required: true },  // Telegram chat_id (number as string)
  isActive:  { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Rider', riderSchema)
