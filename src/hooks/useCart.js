import { useState, useEffect, useCallback } from 'react'
import {
  getCartItems,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from '../utils/cartStorage'

export function useCart() {
  const [items, setItems] = useState(() => getCartItems())

  const refresh = useCallback(() => {
    setItems(getCartItems())
  }, [])

  useEffect(() => {
    window.addEventListener('cart-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('cart-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0,
  )

  return {
    items,
    totalCount,
    totalPrice,
    addItem: (gun, qty = 1) => setItems(addToCart(gun, qty)),
    updateQuantity: (id, qty) => setItems(updateCartQuantity(id, qty)),
    removeItem: (id) => setItems(removeFromCart(id)),
    clear: () => setItems(clearCart()),
  }
}
