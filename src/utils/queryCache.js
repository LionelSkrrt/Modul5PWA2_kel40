// ---------------------------------------------------------------------------
// queryCache.js — In-memory + sessionStorage Query Caching with TTL & SWR
// ---------------------------------------------------------------------------

const memoryCache = new Map()
const STORAGE_PREFIX = 'bore_barrel_qcache_'
const DEFAULT_TTL = 2 * 60 * 1000 // 2 minutes fresh TTL

export const getCachedQuery = (key, ttl = DEFAULT_TTL) => {
  const now = Date.now()

  // 1. Check in-memory cache first
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key)
    return {
      data: entry.data,
      isFresh: now - entry.timestamp < ttl,
      timestamp: entry.timestamp,
    }
  }

  // 2. Check sessionStorage
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (raw) {
      const entry = JSON.parse(raw)
      memoryCache.set(key, entry)
      return {
        data: entry.data,
        isFresh: now - entry.timestamp < ttl,
        timestamp: entry.timestamp,
      }
    }
  } catch {
    /* ignore storage error */
  }

  return null
}

export const setCachedQuery = (key, data) => {
  const entry = {
    data,
    timestamp: Date.now(),
  }
  memoryCache.set(key, entry)
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry))
  } catch {
    /* quota exceeded */
  }
}

export const invalidateQueryCache = (prefix = '') => {
  for (const key of memoryCache.keys()) {
    if (!prefix || key.startsWith(prefix)) {
      memoryCache.delete(key)
    }
  }
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith(`${STORAGE_PREFIX}${prefix}`)) {
        sessionStorage.removeItem(k)
      }
    }
  } catch {
    /* ignore */
  }
}

