import { useState } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  Share2,
  Check,
  ShoppingCart,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Trash2,
  X,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import {
  useReviews,
  useCreateReview,
  getReviewVotes,
  toggleReviewVote,
} from '../../hooks/useReviews'
import { getUserIdentifier, getUserProfile } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'
import { addToCart } from '../../utils/cartStorage'

/**
 * Full-screen product detail view.
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0
  const gunId = gun.id || gun.name

  const currentUserId = getUserIdentifier()
  const currentProfile = getUserProfile()

  // Share & Cart state
  const [shared, setShared] = useState(false)
  const [addedCart, setAddedCart] = useState(false)

  // Reviews
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gunId)
  const { createReview, updateReview, deleteReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Edit Review State
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')

  // Votes state (thumbs up / down)
  const [votes, setVotes] = useState(() => getReviewVotes())

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleShare = async () => {
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
        /* fallback */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShared(true)
      setTimeout(() => setShared(false), 2500)
    } catch {
      /* ignore */
    }
  }

  const handleAddToCart = () => {
    addToCart(gun, 1)
    setAddedCart(true)
    setTimeout(() => setAddedCart(false), 2000)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gunId, {
      user_identifier: currentUserId,
      username: currentProfile.username || 'Shooter',
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Review submitted!')
      setComment('')
      setRating(5)
      refetchReviews()
      setTimeout(() => setReviewSuccess(''), 3000)
    } else {
      setReviewError('Could not submit review.')
    }
  }

  const handleStartEditReview = (rev) => {
    setEditingReviewId(rev.id)
    setEditRating(rev.rating || 5)
    setEditComment(rev.comment || '')
  }

  const handleSaveEditReview = async (revId) => {
    await updateReview(gunId, revId, {
      rating: editRating,
      comment: editComment.trim(),
    })
    setEditingReviewId(null)
    setReviewSuccess('Review updated!')
    refetchReviews()
    setTimeout(() => setReviewSuccess(''), 3000)
  }

  const handleDeleteReview = async (revId) => {
    await deleteReview(gunId, revId)
    setReviewSuccess('Review deleted.')
    refetchReviews()
    setTimeout(() => setReviewSuccess(''), 3000)
  }

  const handleVote = (revId, type) => {
    const nextVotes = toggleReviewVote(revId, type)
    setVotes({ ...nextVotes })
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <img className="detail-img" src={imgSrc} alt={gun.name} loading="lazy" />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions" style={{ flexWrap: 'wrap' }}>
            <FavoriteButton gunId={gunId} />

            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleAddToCart}
            >
              {addedCart ? (
                <>
                  <Check size={15} /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart size={15} /> Add to Cart
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={handleShare}
              title="Share unique product link"
            >
              {shared ? (
                <>
                  <Check size={15} color="var(--brass)" /> Link Copied!
                </>
              ) : (
                <>
                  <Share2 size={15} /> Share Link
                </>
              )}
            </button>

            {onEdit && (
              <button type="button" className="btn btn--outline btn--sm" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger btn--sm" onClick={() => onDelete(gun)}>
                Archive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications (from ingredients / steps if present) */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews &amp; Ratings</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a review for this firearm…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => {
              const revVotes = votes[String(rev.id)] || { up: 0, down: 0, userVote: null }
              const isEditingThis = editingReviewId === rev.id

              return (
                <li key={rev.id} className="review-item">
                  {isEditingThis ? (
                    <div className="review-edit-box">
                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="star-btn"
                            onClick={() => setEditRating(n)}
                          >
                            <Star
                              size={18}
                              fill={n <= editRating ? 'var(--brass)' : 'none'}
                              stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="review-input"
                        rows="2"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        style={{ marginTop: '8px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleSaveEditReview(rev.id)}
                          disabled={submitting}
                        >
                          <Check size={14} /> Save
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => setEditingReviewId(null)}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="review-head">
                        <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                        <span className="review-stars-display">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < rev.rating ? 'var(--brass)' : 'none'}
                              stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                            />
                          ))}
                        </span>
                      </div>

                      {rev.comment && <p className="review-comment">{rev.comment}</p>}

                      <div className="review-footer-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        {/* Thumbs Up / Thumbs Down */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className={`pill ${revVotes.userVote === 'up' ? 'pill--active' : ''}`}
                            onClick={() => handleVote(rev.id, 'up')}
                            style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            title="Helpful (Thumbs Up)"
                          >
                            <ThumbsUp size={13} /> {revVotes.up || 0}
                          </button>

                          <button
                            type="button"
                            className={`pill ${revVotes.userVote === 'down' ? 'pill--active' : ''}`}
                            onClick={() => handleVote(rev.id, 'down')}
                            style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            title="Not Helpful (Thumbs Down)"
                          >
                            <ThumbsDown size={13} /> {revVotes.down || 0}
                          </button>
                        </div>

                        {/* Review CRUD Actions (Edit & Delete) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => handleStartEditReview(rev)}
                            title="Edit review"
                            style={{ padding: '4px 8px', fontSize: '0.78rem', gap: '4px' }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => handleDeleteReview(rev.id)}
                            title="Delete review"
                            style={{ padding: '4px 8px', fontSize: '0.78rem', color: '#c0392b', borderColor: '#f5b7b1', gap: '4px' }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
