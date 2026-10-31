import { useState, useMemo, useEffect } from 'react'
import { RefreshCw, Plus, Loader, AlertCircle, PackageOpen, Database } from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import GunDetail from '../components/gun/GunDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import ConfirmModal from '../components/modals/ConfirmModal'
import { archiveGun, getArchivedGuns } from '../utils/archiveStorage'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
} from '../utils/helpers'

/**
 * Catalog page — the main product listing.
 *
 * Features:
 * - Query Caching via useGuns()
 * - URL deep-link (?gun=<id>) for shared links
 * - Soft Delete (Archive) integration
 * - Search, category filter, sort, detail modal
 */
export default function Catalog({ onNavigate }) {
  // ---- API data with Query Cache ----
  const { guns: apiGuns, loading, error, isCached, refetch } = useGuns({ limit: 50 })
  const [useLocal, setUseLocal] = useState(false)

  // ---- Archived IDs (Soft Delete filter) ----
  const [archivedList, setArchivedList] = useState(() => getArchivedGuns())

  useEffect(() => {
    const syncArchive = () => setArchivedList(getArchivedGuns())
    window.addEventListener('archive-updated', syncArchive)
    return () => window.removeEventListener('archive-updated', syncArchive)
  }, [])

  const archivedIds = useMemo(
    () => new Set(archivedList.map((item) => String(item.id || item.name))),
    [archivedList],
  )

  // Decide data source & filter out soft-deleted items
  const rawGuns = useMemo(() => {
    const base =
      useLocal || (error && apiGuns.length === 0)
        ? GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
        : apiGuns

    return base.filter((g) => !archivedIds.has(String(g.id || g.name)))
  }, [apiGuns, error, useLocal, archivedIds])

  // ---- filters / sort ----
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  const categories = useMemo(() => extractCategories(rawGuns), [rawGuns])

  const filteredGuns = useMemo(() => {
    let result = rawGuns.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [rawGuns, search, activeCategory, sortKey, sortOrder])

  // ---- detail view & deep link (?gun=...) ----
  const [selectedGun, setSelectedGun] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedGunId = params.get('gun')
    if (sharedGunId && rawGuns.length > 0 && !selectedGun) {
      const found = rawGuns.find(
        (g) =>
          String(g.id) === String(sharedGunId) ||
          String(g.name).toLowerCase() === String(sharedGunId).toLowerCase(),
      )
      if (found) {
        setSelectedGun(found)
      }
    }
  }, [rawGuns, selectedGun])

  const handleCloseDetail = () => {
    setSelectedGun(null)
    if (window.location.search.includes('gun=')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  // ---- soft delete (archive) ----
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleSoftDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError('')
      archiveGun(deleteTarget)
      setArchivedList(getArchivedGuns())
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err.message || 'Failed to archive product.')
    } finally {
      setDeleting(false)
    }
  }

  // ---- If viewing a single product detail ----
  if (selectedGun) {
    return (
      <GunDetail
        gun={selectedGun}
        onBack={handleCloseDetail}
        onEdit={(g) => onNavigate && onNavigate('Edit', g)}
        onDelete={(g) => {
          handleCloseDetail()
          setDeleteTarget(g)
        }}
      />
    )
  }

  // ---- Main catalog view ----
  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          A small armory of pistols, rifles, and shotguns. Every piece listed
          with its type, caliber, and price — nothing else.
        </p>
      </section>

      <section>
        <div className="list-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2>Current stock</h2>
            {isCached && (
              <span
                className="mono-badge"
                title="Data served instantly from Query Cache"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
              >
                <Database size={12} /> Cached
              </span>
            )}
          </div>
          <div className="list-head-right">
            <span className="count">
              {filteredGuns.length} piece{filteredGuns.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              className="icon-btn"
              onClick={refetch}
              title="Refresh & invalidate cache"
            >
              <RefreshCw size={14} />
            </button>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={setSearch}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => { setSortKey(key); setSortOrder(order) }}
        />

        {/* States */}
        {loading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && error && !useLocal && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Retry
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                View Local Catalog
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGuns.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No products match your search.</p>
          </div>
        )}

        {/* Product grid */}
        {filteredGuns.length > 0 && (
          <ul className="stock">
            {filteredGuns.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                onSelect={setSelectedGun}
                onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onDelete={setDeleteTarget}
              />
            ))}
          </ul>
        )}

        {useLocal && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setUseLocal(false); refetch() }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>

      {/* Soft Delete (Archive) confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Archive Hardware (Soft Delete)"
        message={`Move "${deleteTarget?.name}" to the Archive? You can restore it anytime from your Profile page or delete it permanently there.`}
        confirmLabel="Archive Item"
        danger
        loading={deleting}
        onConfirm={handleSoftDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError('') }}
      />
      {deleteError && (
        <div className="toast toast--error">{deleteError}</div>
      )}
    </>
  )
}
