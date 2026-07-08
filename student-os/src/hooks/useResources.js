import { useCallback, useEffect, useState } from 'react'
import { fetchResources, addBookmark, removeBookmark } from '../services/resourceService.js'

/**
 * Drives any resource-list view (NotesPage, SubjectPage, search results).
 * Pass a `params` object (search/semester/subject/fileType/sort/page/limit/ids);
 * changing it triggers a refetch.
 */
export default function useResources(params = {}, { enabled = true } = {}) {
  const [resources, setResources] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const paramsKey = JSON.stringify(params)

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await fetchResources(params)
      setResources(data.resources)
      setPagination(data.pagination)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load resources. Please try again.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, enabled])

  useEffect(() => {
    load()
  }, [load])

  const toggleBookmark = useCallback(async (resource) => {
    const wasBookmarked = resource.isBookmarked
    // Optimistic update so the UI feels instant.
    setResources((prev) =>
      prev.map((r) =>
        r.id === resource.id
          ? { ...r, isBookmarked: !wasBookmarked, bookmarksCount: r.bookmarksCount + (wasBookmarked ? -1 : 1) }
          : r
      )
    )
    try {
      if (wasBookmarked) await removeBookmark(resource.id)
      else await addBookmark(resource.id)
    } catch (err) {
      // Revert on failure.
      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id
            ? { ...r, isBookmarked: wasBookmarked, bookmarksCount: r.bookmarksCount + (wasBookmarked ? 1 : -1) }
            : r
        )
      )
    }
  }, [])

  const removeFromList = useCallback((resourceId) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId))
  }, [])

  return { resources, pagination, loading, error, refetch: load, toggleBookmark, removeFromList, setResources }
}
