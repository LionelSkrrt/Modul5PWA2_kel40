// ---------------------------------------------------------------------------
// archiveStorage.js — Soft delete / Archive management in localStorage
// ---------------------------------------------------------------------------

const ARCHIVE_KEY = 'bore_barrel_archived_guns'

export const getArchivedGuns = () => {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const isGunArchived = (id) => {
  if (!id) return false
  const list = getArchivedGuns()
  return list.some((item) => String(item.id) === String(id))
}

export const archiveGun = (gun) => {
  if (!gun) return false
  try {
    const list = getArchivedGuns()
    const id = gun.id || gun.name
    const filtered = list.filter((item) => String(item.id || item.name) !== String(id))
    filtered.unshift({
      ...gun,
      id,
      archivedAt: new Date().toISOString(),
    })
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(filtered))
    window.dispatchEvent(new Event('archive-updated'))
    return true
  } catch {
    return false
  }
}

export const restoreArchivedGun = (id) => {
  try {
    const list = getArchivedGuns()
    const next = list.filter((item) => String(item.id || item.name) !== String(id))
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('archive-updated'))
    return true
  } catch {
    return false
  }
}

export const removeFromArchive = (id) => {
  return restoreArchivedGun(id)
}
