import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Play,
  Edit3,
  Trash2,
  RotateCcw,
  Archive,
  Info,
  Phone,
  MapPin,
  Clock,
  FolderOpen,
} from 'lucide-react'
import userService from '../services/userService'
import gunService from '../services/gunService'
import { useFavorites } from '../hooks/useFavorites'
import {
  getAllDraftIds,
  loadDraft,
  deleteDraft,
  getDraftTimestamp,
  formatDraftTime,
} from '../utils/draftStorage'
import {
  getArchivedGuns,
  restoreArchivedGun,
  removeFromArchive,
} from '../utils/archiveStorage'
import { formatPrice } from '../utils/helpers'
import ConfirmModal from '../components/modals/ConfirmModal'

/**
 * ProfilePage — User identity, Drafts Manager, Soft-Delete Archive, About, & Contact sections.
 */
export default function ProfilePage({
  onReplaySplash,
  onEditProfile,
  onResumeDraft,
}) {
  const [profile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')

  const { favorites } = useFavorites()

  // ---- Drafts list ----
  const [drafts, setDrafts] = useState([])

  const refreshDrafts = useCallback(() => {
    const ids = getAllDraftIds()
    const list = ids
      .map((id) => {
        const data = loadDraft(id)
        const ts = getDraftTimestamp(id) || data?.savedAt
        return {
          id,
          name: data?.formData?.name || (id === 'create' ? 'Untitled New Hardware' : `Draft #${id}`),
          type: data?.formData?.type || 'Pistol',
          price: data?.formData?.price ?? 599,
          timestamp: ts,
          data,
        }
      })
      .filter((d) => d.data)
    setDrafts(list)
  }, [])

  // ---- Archived (Soft Deleted) items ----
  const [archivedGuns, setArchivedGuns] = useState(() => getArchivedGuns())
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null)
  const [deletingPerm, setDeletingPerm] = useState(false)

  const refreshArchive = useCallback(() => {
    setArchivedGuns(getArchivedGuns())
  }, [])

  useEffect(() => {
    refreshDrafts()
    refreshArchive()
    window.addEventListener('archive-updated', refreshArchive)
    return () => window.removeEventListener('archive-updated', refreshArchive)
  }, [refreshDrafts, refreshArchive])

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDeleteDraftItem = (draftId) => {
    deleteDraft(draftId)
    refreshDrafts()
    setFeedback('Draft removed.')
    setTimeout(() => setFeedback(''), 2500)
  }

  const handleRestoreArchived = (item) => {
    restoreArchivedGun(item.id || item.name)
    refreshArchive()
    setFeedback(`"${item.name}" restored to Catalog!`)
    setTimeout(() => setFeedback(''), 3000)
  }

  const handlePermanentDelete = async () => {
    if (!permanentDeleteTarget) return
    try {
      setDeletingPerm(true)
      const targetId = permanentDeleteTarget.id
      if (targetId && !String(targetId).startsWith('local-')) {
        try {
          await gunService.deleteGun(targetId)
        } catch {
          /* ignore server error if offline */
        }
      }
      removeFromArchive(targetId || permanentDeleteTarget.name)
      setPermanentDeleteTarget(null)
      refreshArchive()
      setFeedback('Hardware permanently deleted.')
      setTimeout(() => setFeedback(''), 3000)
    } finally {
      setDeletingPerm(false)
    }
  }

  return (
    <div className="profile-page">
      <section
        className="masthead"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">
            Operator credentials, procurement statistics, drafts, archive, and armory info.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onEditProfile && (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={onEditProfile}
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
          {onReplaySplash && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onReplaySplash}
              title="Replay introductory splash animation"
            >
              <Play size={14} /> Replay Intro
            </button>
          )}
        </div>
      </section>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="avatar-wrap">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="avatar-img" loading="lazy" />
              ) : (
                <div className="avatar-placeholder">
                  <Shield size={36} stroke="var(--brass)" />
                </div>
              )}
            </div>

            <div className="profile-identity">
              <h2 className="display">{profile.username || 'Shooter'}</h2>
              <div className="profile-id-row">
                <span className="mono-badge">{profile.userId}</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={handleCopyId}
                  title="Copy User ID to clipboard"
                >
                  {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
                </button>
              </div>
              {profile.bio && (
                <p style={{ margin: '8px 0 0', color: 'var(--steel)', fontSize: '0.92rem' }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {onEditProfile && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onEditProfile}
            >
              <Edit3 size={14} /> Edit Name &amp; Bio
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="profile-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Saved Drafts</div>
          </div>
          <div className="stat-item">
            <Archive size={20} className="stat-icon" stroke="#c0392b" />
            <div className="stat-val">{archivedGuns.length}</div>
            <div className="stat-label">Archived Items</div>
          </div>
        </div>
      </div>

      {/* SECTION: Saved Drafts */}
      <section className="card-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} stroke="var(--brass)" />
            <h3 className="section-title">Saved Drafts ({drafts.length})</h3>
          </div>
        </div>

        {drafts.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--steel)', background: 'var(--paper)', borderRadius: '4px' }}>
            <FolderOpen size={24} style={{ marginBottom: '6px', opacity: 0.7 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              No saved drafts found. When creating or editing hardware, click &ldquo;Save Draft&rdquo; to save progress here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {drafts.map((d) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {d.name}{' '}
                    <span className="mono-badge" style={{ fontSize: '0.72rem', marginLeft: '6px' }}>
                      {d.id === 'create' ? 'New Hardware Draft' : `Edit ID: ${d.id}`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--steel)', marginTop: '2px' }}>
                    {d.type} · {formatPrice(d.price)} · Saved {formatDraftTime(d.timestamp)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {onResumeDraft && (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => onResumeDraft(d.id)}
                    >
                      <Edit3 size={14} /> Resume Draft
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--danger-ghost btn--sm"
                    onClick={() => handleDeleteDraftItem(d.id)}
                    title="Discard draft"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION: Soft Delete / Archive */}
      <section className="card-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Archive size={20} stroke="var(--brass)" />
            <h3 className="section-title">Archived Hardware / Soft Delete ({archivedGuns.length})</h3>
          </div>
        </div>

        {archivedGuns.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--steel)', background: 'var(--paper)', borderRadius: '4px' }}>
            <Archive size={24} style={{ marginBottom: '6px', opacity: 0.7 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Archive is empty. Items deleted from the catalog are moved here safely (Soft Delete) before permanent removal.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {archivedGuns.map((item) => (
              <div
                key={item.id || item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={item.image_url || item.image || '/guns/pistol.svg'}
                    alt={item.name}
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--line)' }}
                    loading="lazy"
                  />
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--steel)' }}>
                      {item.type || item.category} · {formatPrice(item.price ?? item.cook_time ?? 0)}
                      {item.archivedAt ? ` · Archived ${formatDraftTime(item.archivedAt)}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => handleRestoreArchived(item)}
                  >
                    <RotateCcw size={14} /> Restore
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => setPermanentDeleteTarget(item)}
                  >
                    <Trash2 size={14} /> Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION: About & Contact (Integrated in Profile) */}
      <div className="form-grid">
        <section className="card-box" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Info size={20} stroke="var(--brass)" />
            <h3 className="section-title">About Bore &amp; Barrel</h3>
          </div>
          <h4 className="display" style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>
            A one-room armory.
          </h4>
          <p style={{ margin: 0, color: 'var(--steel)', lineHeight: 1.5, fontSize: '0.95rem' }}>
            Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced
            from the bench — no markup theatre, no filler. Built for reliability and precision.
          </p>
        </section>

        <section className="card-box" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Phone size={20} stroke="var(--brass)" />
            <h3 className="section-title">Contact &amp; Location</h3>
          </div>
          <h4 className="display" style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>
            Come by the shop.
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--steel)', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={15} /> 123 Range Road, Tactical District
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} /> Open Tuesday to Saturday, 10:00 to 18:00
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={15} /> Call (555) 010-0100
            </div>
          </div>
        </section>
      </div>

      {/* Confirm Permanent Delete Modal */}
      <ConfirmModal
        open={Boolean(permanentDeleteTarget)}
        title="Permanently Delete Hardware"
        message={`Are you sure you want to permanently delete "${permanentDeleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Forever"
        danger
        loading={deletingPerm}
        onConfirm={handlePermanentDelete}
        onCancel={() => setPermanentDeleteTarget(null)}
      />
    </div>
  )
}
