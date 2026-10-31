import { Plus, ShoppingCart } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useCart } from '../hooks/useCart'

const NAV_ITEMS = [
  { id: 'Catalog', label: 'Catalog' },
  { id: 'Favorites', label: 'Favorites', badgeType: 'fav' },
  { id: 'Cart', label: 'Cart', badgeType: 'cart', hasIcon: true },
  { id: 'Profile', label: 'Profile' },
]

function Header({ tab, onTab, onNavigateCreate }) {
  const { favorites } = useFavorites()
  const { totalCount: cartCount } = useCart()
  const favCount = favorites ? favorites.length : 0

  return (
    <header className="header">
      <div
        className="header-brand-wrap"
        onClick={() => onTab('Catalog')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <div className="header-logo-badge">
          <img src="/logo.png" alt="Bore & Barrel" />
        </div>
        <span className="brand display">Bore &amp; Barrel</span>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((item) => {
          const count =
            item.badgeType === 'fav'
              ? favCount
              : item.badgeType === 'cart'
              ? cartCount
              : 0

          return (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'nav-link active' : 'nav-link'}
              onClick={() => onTab(item.id)}
            >
              {item.hasIcon && <ShoppingCart size={15} />}
              {item.label}
              {count > 0 && <span className="nav-badge">{count}</span>}
            </button>
          )
        })}
      </nav>

      {onNavigateCreate && (
        <button
          type="button"
          className="btn btn--primary btn--sm header-cta"
          onClick={onNavigateCreate}
          title="Register new hardware"
        >
          <Plus size={15} /> Add Hardware
        </button>
      )}
    </header>
  )
}

export default Header
