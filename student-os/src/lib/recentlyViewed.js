import { RECENTLY_VIEWED_KEY, RECENTLY_VIEWED_LIMIT } from '../constants/resourceOptions.js'

/**
 * "Recently Viewed" is tracked client-side in localStorage rather than a
 * database collection — the spec's data model deliberately has only Users,
 * Resources, and Bookmarks. NotesPage/CareerResourcesPage read this list and
 * batch-fetch the matching resources via GET /api/resources?ids=...
 *
 * Namespaced by category ('academic' | 'career') under one shared key —
 * academic and career resources are unrelated lists (a career-resource id
 * batch-fetched with category=academic would just come back empty), so they
 * can't share a single flat array without one page's views crowding out the
 * other's.
 */
function readStore() {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function recordResourceView(resourceId, category = 'academic') {
  if (!resourceId) return
  try {
    const store = readStore()
    const existing = (store[category] || []).filter((id) => id !== resourceId)
    store[category] = [resourceId, ...existing].slice(0, RECENTLY_VIEWED_LIMIT)
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(store))
  } catch {
    // localStorage unavailable (private browsing, etc.) — safe to ignore.
  }
}

export function getRecentlyViewedIds(category = 'academic') {
  const store = readStore()
  return Array.isArray(store[category]) ? store[category] : []
}
