/**
 * telegram.js
 * Telegram Bot API দিয়ে message পাঠানো।
 * BOT_TOKEN = BotFather থেকে পাওয়া token
 * OWNER_CHAT_ID = রেস্টুরেন্ট owner এর Telegram chat ID
 */

const BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

/* ── Low-level send ── */
async function tgSend(chatId, text, extra = {}) {
  const res = await fetch(`${BASE}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  })
  const data = await res.json()
  if (!data.ok) console.error('Telegram error:', data)
  return data
}

/* ── Edit an existing message ── */
async function tgEdit(chatId, messageId, text) {
  await fetch(`${BASE}/editMessageText`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' }),
  })
}

/* ────────────────────────────────────────
   ORDER FORMAT HELPERS
──────────────────────────────────────── */
const sizeLabel = { reg: 'Regular', med: 'Medium', lar: 'Large' }
const statusBadge = {
  pending:    '🟡 Pending',
  confirmed:  '🟢 Confirmed',
  assigned:   '🔵 Assigned',
  on_the_way: '🚴 On the Way',
  delivered:  '✅ Delivered',
  cancelled:  '❌ Cancelled',
}

function buildOrderText(order, riderName = null) {
  const items = order.items.map(i => {
    const sz = i.size ? ` (${sizeLabel[i.size] || i.size})` : ''
    return `  • ${i.name}${sz} × ${i.qty}  →  ৳${i.subtotal}`
  }).join('\n')

  const riderLine = riderName ? `\n🚴 <b>Rider:</b> ${riderName}` : ''

  return `
🍕 <b>Mr. Dough — Order #${order.orderNumber}</b>
${statusBadge[order.status] || ''}

👤 <b>Customer:</b> ${order.customer.name}
📱 <b>Phone:</b> ${order.customer.phone}
📍 <b>Address:</b> ${order.customer.address}
${order.customer.note ? `📝 <b>Note:</b> ${order.customer.note}\n` : ''}
━━━━━━━━━━━━━━━━━━
<b>Items:</b>
${items}
━━━━━━━━━━━━━━━━━━
🧾 Subtotal:       ৳${order.subtotal}
🚚 Delivery:       ৳${order.deliveryCharge}
💰 <b>Total:         ৳${order.total}</b>${riderLine}

🕐 ${new Date(order.createdAt).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}
`.trim()
}

function buildRiderText(order) {
  const items = order.items.map(i => {
    const sz = i.size ? ` (${sizeLabel[i.size] || i.size})` : ''
    return `  • ${i.name}${sz} × ${i.qty}`
  }).join('\n')

  return `
🚴 <b>Mr. Dough — Delivery Assignment</b>
📦 Order #${order.orderNumber}

👤 <b>Customer:</b> ${order.customer.name}
📱 <b>Phone:</b> <code>${order.customer.phone}</code>
📍 <b>Address:</b> ${order.customer.address}
${order.customer.note ? `📝 <b>Note:</b> ${order.customer.note}\n` : ''}
━━━━━━━━━━━━━━━━━━
<b>Items:</b>
${items}
━━━━━━━━━━━━━━━━━━
💰 <b>Collect:  ৳${order.total}</b>
  (Delivery charge ৳${order.deliveryCharge} সহ)

✅ ডেলিভারি হলে Admin কে জানাও।
`.trim()
}

/* ────────────────────────────────────────
   EXPORTS
──────────────────────────────────────── */

/** নতুন order আসলে owner কে notify করো */
export async function notifyOwnerNewOrder(order) {
  const chatId = process.env.OWNER_CHAT_ID
  if (!chatId) return null
  const text = buildOrderText(order)
  const data = await tgSend(chatId, text)
  return data.ok ? data.result.message_id : null
}

/** Order status বদলালে owner এর পুরানো message edit করো */
export async function updateOwnerMessage(order, riderName) {
  const chatId = process.env.OWNER_CHAT_ID
  if (!chatId || !order.ownerTgMsgId) return
  await tgEdit(chatId, order.ownerTgMsgId, buildOrderText(order, riderName))
}

/** Rider assign হলে তার Telegram এ details পাঠাও */
export async function notifyRider(order, rider) {
  if (!rider?.telegramId) return null
  const text = buildRiderText(order)
  const data = await tgSend(rider.telegramId, text)
  return data.ok ? data.result.message_id : null
}

/** Owner কে custom update পাঠাও (status change notification) */
export async function sendOwnerUpdate(text) {
  const chatId = process.env.OWNER_CHAT_ID
  if (!chatId) return
  await tgSend(chatId, text)
}
