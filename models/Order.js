import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  id:       String,
  name:     String,
  category: String,
  desc:     String,
  size:     String,   // 'reg' | 'med' | 'lar' | null
  price:    Number,
  qty:      Number,
  subtotal: Number,
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderNumber: { type: Number },   // auto-set: 1001, 1002, …

  /* Customer info */
  customer: {
    name:    { type: String, required: true },
    phone:   { type: String, required: true },
    address: { type: String, required: true },
    zone:    { type: String },       // delivery zone id
    note:    { type: String, default: '' },
  },

  /* Items */
  items: [orderItemSchema],

  /* Pricing */
  subtotal:      { type: Number, required: true },
  deliveryCharge:{ type: Number, default: 0 },
  total:         { type: Number, required: true },

  /* Status flow: pending → confirmed → assigned → delivered | cancelled */
  status: {
    type: String,
    enum: ['pending','confirmed','assigned','on_the_way','delivered','cancelled'],
    default: 'pending',
  },

  /* Rider assignment */
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rider',
    default: null,
  },

  /* Telegram message ids for editing later if needed */
  ownerTgMsgId: { type: Number, default: null },
  riderTgMsgId: { type: Number, default: null },

}, { timestamps: true })

/* Auto-increment orderNumber before first save */
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const last = await mongoose.model('Order').findOne().sort({ orderNumber: -1 }).lean()
    this.orderNumber = (last?.orderNumber ?? 1000) + 1
  }
  next()
})

export default mongoose.model('Order', orderSchema)
