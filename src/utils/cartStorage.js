// ---------------------------------------------------------------------------
// cartStorage.js — Shopping cart persistence + WhatsApp checkout builder
// ---------------------------------------------------------------------------

const CART_KEY = 'bore_barrel_cart'
const WA_PHONE_KEY = 'bore_barrel_wa_phone'

export const getCartItems = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const saveCartItems = (items) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event('cart-updated'))
    return true
  } catch {
    return false
  }
}

export const addToCart = (gun, quantity = 1) => {
  if (!gun) return []
  const items = getCartItems()
  const id = String(gun.id || gun.name)
  const existingIdx = items.findIndex((i) => String(i.id) === id)

  if (existingIdx > -1) {
    items[existingIdx].quantity = (items[existingIdx].quantity || 1) + quantity
  } else {
    items.push({
      id,
      name: gun.name || 'Hardware Piece',
      type: gun.type || gun.category || 'Hardware',
      caliber: gun.caliber || gun.difficulty || '',
      price: Number(gun.price ?? gun.cook_time ?? 0),
      image_url: gun.image_url || gun.image || '/guns/pistol.svg',
      quantity,
    })
  }
  saveCartItems(items)
  return items
}

export const updateCartQuantity = (id, quantity) => {
  const items = getCartItems()
  const targetId = String(id)
  if (quantity <= 0) {
    return removeFromCart(targetId)
  }
  const next = items.map((item) =>
    String(item.id) === targetId ? { ...item, quantity } : item,
  )
  saveCartItems(next)
  return next
}

export const removeFromCart = (id) => {
  const items = getCartItems()
  const next = items.filter((item) => String(item.id) !== String(id))
  saveCartItems(next)
  return next
}

export const clearCart = () => {
  saveCartItems([])
  return []
}

export const getSavedWaPhone = () => {
  try {
    return localStorage.getItem(WA_PHONE_KEY) || '6281234567890'
  } catch {
    return '6281234567890'
  }
}

export const saveWaPhone = (phone) => {
  try {
    const cleaned = String(phone).replace(/[^0-9]/g, '')
    localStorage.setItem(WA_PHONE_KEY, cleaned)
    return cleaned
  } catch {
    return phone
  }
}

export const buildWhatsAppCheckoutUrl = (items, phone = '') => {
  let cleanPhone = String(phone || getSavedWaPhone()).replace(/[^0-9]/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = `62${cleanPhone.slice(1)}`
  }

  const lines = ['Hi aku mau pesan barang ini:']
  let total = 0

  items.forEach((item, idx) => {
    const sub = (Number(item.price) || 0) * (item.quantity || 1)
    total += sub
    lines.push(
      `${idx + 1}. ${item.name} (${item.type}${item.caliber ? ` - ${item.caliber}` : ''}) x${item.quantity} = $${sub.toLocaleString()}`,
    )
  })

  lines.push(`\nTotal Pesanan: $${total.toLocaleString()}`)
  lines.push('Terima kasih!')

  const text = encodeURIComponent(lines.join('\n'))
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${text}`
    : `https://wa.me/?text=${text}`
}
