import { RECENTLY_VIEWED_KEY, RECENTLY_VIEWED_LIMIT } from '../constants/resourceOptions.js'

/**
 * "Recently Viewed" is tracked client-side in localStorage rather than a
 * database collection — the spec's data model deliberately has only Users,
 * Resources, and Bookmarks. NotesPage reads this list and batch-fetches the
 * matching resources via GET /api/resources?ids=...
 */
export function recordResourceView(resourceId) {
  if (!resourceId) return
  try {
    const existing = getRecentlyViewedIds().filter((id) => id !== resourceId)
    const next = [resourceId, ...existing].slice(0, RECENTLY_VIEWED_LIMIT)
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next))
  } catch {
    // localStorage unavailable (private browsing, etc.) — safe to ignore.
  }
}

export function getRecentlyViewedIds() {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
