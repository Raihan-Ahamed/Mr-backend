import mongoose from 'mongoose'

const deliveryZoneSchema = new mongoose.Schema({
  id:     { type: String, required: true, unique: true },
  name:   { type: String, required: true },
  charge: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('DeliveryZone', deliveryZoneSchema)
