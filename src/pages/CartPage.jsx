import { useState } from 'react'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  MessageCircle,
  Phone,
} from 'lucide-react'
import { useCart } from '../hooks/useCart'
import {
  buildWhatsAppCheckoutUrl,
  getSavedWaPhone,
  saveWaPhone,
} from '../utils/cartStorage'
import { formatPrice } from '../utils/helpers'

/**
 * CartPage — Shopping cart with quantity controls & WhatsApp Checkout redirect.
 */
export default function CartPage({ onNavigateCatalog }) {
  const { items, totalCount, totalPrice, updateQuantity, removeItem, clear } = useCart()
  const [waPhone, setWaPhone] = useState(() => getSavedWaPhone())

  const handlePhoneChange = (e) => {
    const val = e.target.value
    setWaPhone(val)
    saveWaPhone(val)
  }

  const handleCheckoutWhatsApp = () => {
    if (items.length === 0) return
    const url = buildWhatsAppCheckoutUrl(items, waPhone)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fav-page">
      <section className="masthead">
        <h1 className="display">Procurement Cart</h1>
        <p className="lede">
          Review selected firearms and equipment before placing your order via WhatsApp.
        </p>
      </section>

      <section className="fav-content">
        <div className="list-head">
          <h2>Items in Cart ({totalCount})</h2>
          {items.length > 0 && (
            <button
              type="button"
              className="btn btn--danger-ghost btn--sm"
              onClick={clear}
            >
              <Trash2 size={14} /> Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="state-box">
            <ShoppingCart size={36} stroke="var(--steel)" />
            <h3>Your cart is empty</h3>
            <p className="lede">
              Browse the catalog and click the cart icon on any hardware item to add it here.
            </p>
            {onNavigateCatalog && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={onNavigateCatalog}
                style={{ marginTop: '16px' }}
              >
                Browse Catalog <ArrowRight size={16} />
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="card-box"
                  style={{
                    marginBottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={item.image_url || '/guns/pistol.svg'}
                      alt={item.name}
                      style={{
                        width: '68px',
                        height: '68px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid var(--line)',
                      }}
                      loading="lazy"
                    />
                    <div>
                      <h3 className="display" style={{ margin: '0 0 4px', fontSize: '1.15rem' }}>
                        {item.name}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--steel)' }}>
                        {item.type}
                        {item.caliber ? ` · ${item.caliber}` : ''}
                      </div>
                      <div className="price" style={{ padding: 0, marginTop: '4px', fontSize: '1rem' }}>
                        {formatPrice(item.price)} each
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                        {item.quantity || 1}
                      </span>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div style={{ minWidth: '80px', textAlign: 'right', fontWeight: 700, color: 'var(--ink)' }}>
                      {formatPrice((Number(item.price) || 0) * (item.quantity || 1))}
                    </div>

                    <button
                      type="button"
                      className="btn btn--danger-ghost btn--sm"
                      onClick={() => removeItem(item.id)}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Summary Card */}
            <div className="card-box" style={{ marginBottom: 0 }}>
              <h3 className="section-title" style={{ marginBottom: '14px' }}>
                Order Summary &amp; WhatsApp Checkout
              </h3>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="wa-phone-input" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} /> Nomor WhatsApp Tujuan (Bisa pakai WA Pribadi)
                </label>
                <input
                  id="wa-phone-input"
                  type="text"
                  value={waPhone}
                  onChange={handlePhoneChange}
                  placeholder="Contoh: 6281234567890 atau 081234567890"
                  className="form-input"
                />
                <span className="form-hint">
                  Otomatis mengirim pesan: &ldquo;Hi aku mau pesan barang ini...&rdquo; beserta rincian barang.
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--line)',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--steel)' }}>
                    Total ({totalCount} item{totalCount !== 1 ? 's' : ''})
                  </div>
                  <div className="display" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--brass)' }}>
                    {formatPrice(totalPrice)}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleCheckoutWhatsApp}
                  style={{ background: '#1e8449', borderColor: '#1e8449' }}
                >
                  <MessageCircle size={18} /> Checkout via WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
