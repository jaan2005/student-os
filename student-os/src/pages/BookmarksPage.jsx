import { useEffect, useMemo, useState } from 'react'
import Topbar from '../components/Topbar.jsx'
import ResourceGrid from '../components/ResourceGrid.jsx'
import UploadModal from '../components/UploadModal.jsx'
import useDebounce from '../hooks/useDebounce.js'
import { useAuth } from '../context/AuthContext.jsx'
import { canUpload } from '../constants/roles.js'
import { fetchBookmarks, removeBookmark, deleteResource } from '../services/resourceService.js'

export default function BookmarksPage() {
  const { user } = useAuth()
  const userCanUpload = canUpload(user?.role)
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid')
  const [uploadOpen, setUploadOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 250)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchBookmarks()
      setResources(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return resources
    const q = debouncedSearch.trim().toLowerCase()
    return resources.filter((r) =>
      [r.title, r.subject, r.semester, r.unit, r.topic, r.description, ...(r.tags || [])]
        .filter(Boolean)
        .some((field) => field.toString().toLowerCase().includes(q))
    )
  }, [resources, debouncedSearch])

  const handleToggleBookmark = async (resource) => {
    // On this page, "un-bookmarking" should remove the card entirely.
    setResources((prev) => prev.filter((r) => r.id !== resource.id))
    try {
      await removeBookmark(resource.id)
    } catch {
      setResources((prev) => [resource, ...prev])
    }
  }

  const handleDelete = async (id) => {
    await deleteResource(id)
    setResources((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div>
      <Topbar
        search={search}
        onSearchChange={setSearch}
        view={view}
        onViewChange={setView}
        onUploadClick={userCanUpload ? () => setUploadOpen(true) : undefined}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <ResourceGrid
          resources={filtered}
          loading={loading}
          view={view}
          currentUserId={user?.id}
          currentUserRole={user?.role}
          onToggleBookmark={handleToggleBookmark}
          onDelete={handleDelete}
          emptyTitle="No bookmarks yet"
          emptyDescription="Bookmark resources from Notes & Resources to find them quickly here."
        />
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={load} />
    </div>
  )
}
