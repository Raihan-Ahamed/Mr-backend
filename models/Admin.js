import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const adminSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name:     { type: String, default: 'Admin' },
}, { timestamps: true })

// Password save এর আগে hash করো
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

adminSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

export default mongoose.model('Admin', adminSchema)
