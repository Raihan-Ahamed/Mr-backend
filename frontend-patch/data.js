/**
 * data.js — UPDATED VERSION
 * Backend এ connect করে live data আনে।
 * পুরানো hardcoded export গুলো fallback হিসেবে রাখা আছে।
 *
 * ব্যবহার:  VITE_API_URL=https://your-api.onrender.com  →  .env ফাইলে দাও
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/* ── ফাংশন: backend থেকে menu আনো ── */
export async function fetchMenu() {
  const [itemsRes, catsRes, zonesRes] = await Promise.all([
    fetch(`${API}/api/menu`),
    fetch(`${API}/api/settings/categories`),
    fetch(`${API}/api/settings/zones`),
  ])
  const menuItems    = await itemsRes.json()
  const categories   = await catsRes.json()
  const deliveryZones = await zonesRes.json()

  const bestSellerIds = menuItems.filter(i => i.isBestSeller).map(i => i.id)

  return { menuItems, categories, deliveryZones, bestSellerIds }
}

/* ── Static fallback (backend ছাড়াও কাজ করবে) ── */
export const sizeLabel = { reg: 'Regular', med: 'Medium', lar: 'Large' }

// (পুরানো hardcoded export গুলো আর লাগবে না — app.jsx পরিবর্তন করতে হবে)
// নিচের exports শুধু compatibility এর জন্য রাখা আছে:
export const categories = []
export const menuItems = []
export const deliveryZones = []
export const bestSellerIds = []
