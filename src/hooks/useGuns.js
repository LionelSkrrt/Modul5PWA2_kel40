import { useState, useEffect, useCallback } from 'react'
import gunService from '../services/gunService'
import {
  getCachedQuery,
  setCachedQuery,
  invalidateQueryCache,
} from '../utils/queryCache'

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API
// with Stale-While-Revalidate (SWR) Query Caching.
// ---------------------------------------------------------------------------

export function useGuns(params = {}) {
  const paramKey = JSON.stringify(params)
  const cacheKey = `guns_list_${paramKey}`

  const [guns, setGuns] = useState(() => {
    const cached = getCachedQuery(cacheKey)
    return cached?.data?.guns || []
  })
  const [loading, setLoading] = useState(() => !getCachedQuery(cacheKey))
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(() => {
    const cached = getCachedQuery(cacheKey)
    return cached?.data?.pagination || null
  })
  const [isCached, setIsCached] = useState(() => Boolean(getCachedQuery(cacheKey)))

  const fetchGuns = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        invalidateQueryCache('guns_')
      } else {
        const cached = getCachedQuery(cacheKey)
        if (cached && cached.isFresh) {
          setGuns(cached.data.guns || [])
          setPagination(cached.data.pagination || null)
          setIsCached(true)
          setLoading(false)
          return
        }
      }

      setLoading((prev) => (guns.length === 0 ? true : prev))
      setError(null)

      const response = await gunService.getGuns(params)

      if (response.success) {
        const list = response.data || []
        const pag = response.pagination || null
        setGuns(list)
        setPagination(pag)
        setIsCached(false)
        setCachedQuery(cacheKey, { guns: list, pagination: pag })
      } else {
        setError(response.message || 'Failed to fetch products.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching products.')
      const fallbackCache = getCachedQuery(cacheKey, Infinity)
      if (!fallbackCache) {
        setGuns([])
      }
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey, cacheKey])

  useEffect(() => {
    fetchGuns(false)
  }, [fetchGuns])

  const refetch = useCallback(() => fetchGuns(true), [fetchGuns])

  return { guns, loading, error, pagination, isCached, refetch }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its ID with Query Caching.
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const cacheKey = `guns_detail_${id}`

  const [gun, setGun] = useState(() => getCachedQuery(cacheKey)?.data || null)
  const [loading, setLoading] = useState(() => Boolean(id && !getCachedQuery(cacheKey)))
  const [error, setError] = useState(null)

  const fetchGun = useCallback(async (forceRefresh = false) => {
    if (!id) {
      setLoading(false)
      return
    }
    try {
      if (!forceRefresh) {
        const cached = getCachedQuery(cacheKey)
        if (cached && cached.isFresh) {
          setGun(cached.data)
          setLoading(false)
          return
        }
      }

      setLoading(true)
      setError(null)

      const response = await gunService.getGunById(id)

      if (response.success) {
        setGun(response.data)
        setCachedQuery(cacheKey, response.data)
      } else {
        setError(response.message || 'Product not found.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load product details.')
      setGun(null)
    } finally {
      setLoading(false)
    }
  }, [id, cacheKey])

  useEffect(() => {
    fetchGun(false)
  }, [fetchGun])

  return { gun, loading, error, refetch: () => fetchGun(true) }
}
