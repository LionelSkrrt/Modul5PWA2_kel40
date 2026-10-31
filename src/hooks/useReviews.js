import { useState, useEffect, useCallback } from 'react'
import reviewService from '../services/reviewService'
import {
  getCachedQuery,
  setCachedQuery,
  invalidateQueryCache,
} from '../utils/queryCache'

const LOCAL_REVIEWS_KEY = 'bore_barrel_local_reviews_'
const VOTES_KEY = 'bore_barrel_review_votes'

const getLocalReviews = (gunId) => {
  try {
    const raw = localStorage.getItem(`${LOCAL_REVIEWS_KEY}${gunId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveLocalReviews = (gunId, list) => {
  try {
    localStorage.setItem(`${LOCAL_REVIEWS_KEY}${gunId}`, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export const getReviewVotes = () => {
  try {
    const raw = localStorage.getItem(VOTES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const toggleReviewVote = (reviewId, type) => {
  const votes = getReviewVotes()
  const key = String(reviewId)
  const current = votes[key] || { up: 0, down: 0, userVote: null }

  if (current.userVote === type) {
    // undo vote
    current[type] = Math.max(0, (current[type] || 1) - 1)
    current.userVote = null
  } else {
    if (current.userVote) {
      current[current.userVote] = Math.max(0, (current[current.userVote] || 1) - 1)
    }
    current[type] = (current[type] || 0) + 1
    current.userVote = type
  }

  votes[key] = current
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes))
  } catch {
    /* ignore */
  }
  return votes
}

// ---------------------------------------------------------------------------
// useReviews — fetch reviews for a specific product (with Query Cache & fallback)
// ---------------------------------------------------------------------------

export function useReviews(gunId) {
  const cacheKey = `reviews_${gunId}`
  const [reviews, setReviews] = useState(() => getCachedQuery(cacheKey)?.data || [])
  const [loading, setLoading] = useState(() => Boolean(gunId && !getCachedQuery(cacheKey)))
  const [error, setError] = useState(null)

  const fetchReviews = useCallback(async (forceRefresh = false) => {
    if (!gunId) {
      setLoading(false)
      return
    }
    try {
      if (!forceRefresh) {
        const cached = getCachedQuery(cacheKey)
        if (cached && cached.isFresh) {
          setReviews(cached.data)
          setLoading(false)
          return
        }
      }

      setLoading(true)
      setError(null)

      if (String(gunId).startsWith('local-')) {
        const local = getLocalReviews(gunId)
        setReviews(local)
        setCachedQuery(cacheKey, local)
        setLoading(false)
        return
      }

      const response = await reviewService.getReviews(gunId)

      if (response.success) {
        const serverList = response.data || []
        const localList = getLocalReviews(gunId)
        const mergedMap = new Map()
        ;[...localList, ...serverList].forEach((r) => {
          mergedMap.set(String(r.id), r)
        })
        const merged = Array.from(mergedMap.values())
        setReviews(merged)
        setCachedQuery(cacheKey, merged)
      } else {
        setReviews(getLocalReviews(gunId))
      }
    } catch {
      const local = getLocalReviews(gunId)
      setReviews(local)
    } finally {
      setLoading(false)
    }
  }, [gunId, cacheKey])

  useEffect(() => {
    fetchReviews(false)
  }, [fetchReviews])

  return {
    reviews,
    loading,
    error,
    refetch: () => fetchReviews(true),
  }
}

// ---------------------------------------------------------------------------
// useCreateReview — submit, update, and delete reviews for a product.
// ---------------------------------------------------------------------------

export function useCreateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const createReview = async (gunId, reviewData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      invalidateQueryCache(`reviews_${gunId}`)

      if (!String(gunId).startsWith('local-')) {
        const response = await reviewService.createReview(gunId, reviewData)
        if (response.success && response.data) {
          const created = {
            ...response.data,
            user_id: reviewData.user_identifier,
            user_identifier: reviewData.username || `Operator ${String(reviewData.user_identifier).substring(0, 8)}`,
          }
          const local = getLocalReviews(gunId)
          saveLocalReviews(gunId, [created, ...local])
          setSuccess(true)
          return created
        }
      }

      // Fallback local review creation
      const fallbackReview = {
        id: `rev-${Date.now()}`,
        product_id: gunId,
        user_id: reviewData.user_identifier,
        user_identifier: reviewData.username || `Operator ${String(reviewData.user_identifier).substring(0, 8)}`,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
        created_at: new Date().toISOString(),
      }
      const local = getLocalReviews(gunId)
      saveLocalReviews(gunId, [fallbackReview, ...local])
      setSuccess(true)
      return fallbackReview
    } catch {
      const fallbackReview = {
        id: `rev-${Date.now()}`,
        product_id: gunId,
        user_id: reviewData.user_identifier,
        user_identifier: reviewData.username || `Operator ${String(reviewData.user_identifier).substring(0, 8)}`,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
        created_at: new Date().toISOString(),
      }
      const local = getLocalReviews(gunId)
      saveLocalReviews(gunId, [fallbackReview, ...local])
      setSuccess(true)
      return fallbackReview
    } finally {
      setLoading(false)
    }
  }

  const updateReview = async (gunId, reviewId, reviewData) => {
    try {
      setLoading(true)
      setError(null)
      invalidateQueryCache(`reviews_${gunId}`)

      // Update in local cache first
      const local = getLocalReviews(gunId)
      const updatedLocal = local.map((r) =>
        String(r.id) === String(reviewId)
          ? { ...r, rating: Number(reviewData.rating), comment: reviewData.comment }
          : r,
      )
      saveLocalReviews(gunId, updatedLocal)

      if (!String(reviewId).startsWith('rev-') && !String(gunId).startsWith('local-')) {
        await reviewService.updateReview(reviewId, reviewData)
      }
      return true
    } catch {
      return true
    } finally {
      setLoading(false)
    }
  }

  const deleteReview = async (gunId, reviewId) => {
    try {
      setLoading(true)
      setError(null)
      invalidateQueryCache(`reviews_${gunId}`)

      const local = getLocalReviews(gunId)
      saveLocalReviews(
        gunId,
        local.filter((r) => String(r.id) !== String(reviewId)),
      )

      if (!String(reviewId).startsWith('rev-') && !String(gunId).startsWith('local-')) {
        await reviewService.deleteReview(reviewId)
      }
      return true
    } catch {
      return true
    } finally {
      setLoading(false)
    }
  }

  return { createReview, updateReview, deleteReview, loading, error, success }
}
