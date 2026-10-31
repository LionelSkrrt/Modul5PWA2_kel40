import { useState } from 'react'
import { Share2, Check, ShoppingCart } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { formatPrice, truncate } from '../../utils/helpers'
import { addToCart } from '../../utils/cartStorage'

/**
 * Product card used in the catalog grid.
 */
export default function GunCard({ gun, onSelect, onEdit, onDelete }) {
  const [shared, setShared] = useState(false)
  const [addedCart, setAddedCart] = useState(false)

  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0
  const gunId = gun.id || gun.name

  const handleShare = async (e) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}${window.location.pathname}?gun=${encodeURIComponent(gunId)}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${gun.name} — Bore & Barrel`,
          text: `Check out ${gun.name} (${category}) at Bore & Barrel!`,
          url: shareUrl,
        })
        return
      } catch {
        /* fallback to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addToCart(gun, 1)
    setAddedCart(true)
    setTimeout(() => setAddedCart(false), 1500)
  }

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`View ${gun.name}`}
      >
        <img
          className="card-img"
          src={imgSrc}
          alt={gun.name}
          width="240"
          height="180"
          loading="lazy"
          decoding="async"
        />

        <span className="name display">{gun.name}</span>

        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>

        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}

        <span className="price">{formatPrice(price)}</span>
      </button>

      {/* Floating actions row */}
      <div className="card-actions">
        <button
          type="button"
          className="card-act-btn"
          onClick={handleAddToCart}
          aria-label={`Add ${gun.name} to cart`}
          title={addedCart ? 'Added to Cart!' : 'Add to Cart'}
        >
          {addedCart ? <Check size={15} color="#1e8449" /> : <ShoppingCart size={15} />}
        </button>

        <button
          type="button"
          className="card-act-btn"
          onClick={handleShare}
          aria-label={`Share ${gun.name}`}
          title={shared ? 'Link Copied!' : 'Share unique link'}
        >
          {shared ? <Check size={15} color="var(--brass)" /> : <Share2 size={15} />}
        </button>

        <FavoriteButton gunId={gunId} />

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(gun) }}
            aria-label={`Edit ${gun.name}`}
            title="Edit"
          >
            ✏️
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete(gun) }}
            aria-label={`Archive ${gun.name}`}
            title="Archive (Soft Delete)"
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  )
}
