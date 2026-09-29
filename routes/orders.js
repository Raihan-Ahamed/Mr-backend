import express from 'express'
import Order  from '../models/Order.js'
import Rider  from '../models/Rider.js'
import { requireAdmin } from '../middleware/auth.js'
import {
  notifyOwnerNewOrder,
  updateOwnerMessage,
  notifyRider,
  sendOwnerUpdate,
} from '../services/telegram.js'

const router = express.Router()

/* ════════════════════════════════════════
   PUBLIC: Frontend থেকে order দেওয়া
════════════════════════════════════════ */
router.post('/', async (req, res) => {
  try {
    const { customer, items, subtotal, deliveryCharge, total } = req.body

    if (!customer?.name || !customer?.phone || !customer?.address)
      return res.status(400).json({ error: 'নাম, ফোন ও ঠিকানা দিন' })
    if (!items?.length)
      return res.status(400).json({ error: 'Cart খালি' })

    const order = await Order.create({
      customer, items, subtotal,
      deliveryCharge: deliveryCharge ?? 0,
      total,
    })

    /* Owner কে Telegram এ notify করো (failure হলে order এরো বাদেও সফল থাকবে) */
    try {
      const msgId = await notifyOwnerNewOrder(order)
      if (msgId) {
        order.ownerTgMsgId = msgId
        await order.save()
      }
    } catch (tgErr) {
      console.error('Telegram notification failed (order still saved):', tgErr.message)
    }

    res.status(201).json({ ok: true, orderNumber: order.orderNumber })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/* ════════════════════════════════════════
   ADMIN: সব orders (dashboard)
════════════════════════════════════════ */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query
    const filter = status ? { status } : {}
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(skip))
        .populate('rider', 'name phone telegramId'),
      Order.countDocuments(filter),
    ])
    res.json({ orders, total })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* একটি order এর details */
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('rider')
    if (!order) return res.status(404).json({ error: 'Order পাওয়া যায়নি' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ════════════════════════════════════════
   ADMIN: Rider assign করো
════════════════════════════════════════ */
router.patch('/:id/assign', requireAdmin, async (req, res) => {
  try {
    const { riderId } = req.body
    if (!riderId) return res.status(400).json({ error: 'riderId দিন' })

    const [order, rider] = await Promise.all([
      Order.findById(req.params.id),
      Rider.findById(riderId),
    ])
    if (!order) return res.status(404).json({ error: 'Order নেই' })
    if (!rider) return res.status(404).json({ error: 'Rider নেই' })

    order.rider  = rider._id
    order.status = 'assigned'
    await order.save()

    /* Rider এর Telegram এ details পাঠাও */
    const riderMsgId = await notifyRider(order, rider)
    if (riderMsgId) { order.riderTgMsgId = riderMsgId; await order.save() }

    /* Owner এর message update করো */
    await updateOwnerMessage(order, rider.name)

    res.json({ ok: true, order: await order.populate('rider', 'name phone') })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ════════════════════════════════════════
   ADMIN: Status update
════════════════════════════════════════ */
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending','confirmed','assigned','on_the_way','delivered','cancelled']
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status' })

    const order = await Order.findById(req.params.id).populate('rider', 'name phone')
    if (!order) return res.status(404).json({ error: 'Order নেই' })

    order.status = status
    await order.save()

    /* Owner এর Telegram message edit করো */
    await updateOwnerMessage(order, order.rider?.name)

    /* on_the_way হলে owner কে আলাদা notification */
    if (status === 'on_the_way') {
      await sendOwnerUpdate(
        `🚴 Order #${order.orderNumber} রাইডার নিয়ে রওনা হয়েছে!\nCustomer: ${order.customer.name} | ৳${order.total}`
      )
    }

    res.json({ ok: true, order })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
