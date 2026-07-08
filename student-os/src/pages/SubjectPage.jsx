import { useMemo, useState } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Menu, LayoutGrid, List, Plus } from 'lucide-react'
import ResourceGrid from '../components/ResourceGrid.jsx'
import SearchBar from '../components/SearchBar.jsx'
import UploadModal from '../components/UploadModal.jsx'
import useResources from '../hooks/useResources.js'
import useDebounce from '../hooks/useDebounce.js'
import { useAuth } from '../context/AuthContext.jsx'
import { canUpload } from '../constants/roles.js'
import { deleteResource } from '../services/resourceService.js'

export default function SubjectPage() {
  const { semester, subject: encodedSubject } = useParams()
  const subject = decodeURIComponent(encodedSubject)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openSidebar } = useOutletContext() || {}
  const userCanUpload = canUpload(user?.role)

  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid')
  const [uploadOpen, setUploadOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { resources, loading, toggleBookmark, removeFromList, refetch } = useResources({
    semester,
    subject,
    search: debouncedSearch,
    sort: 'newest',
    limit: 100,
  })

  const grouped = useMemo(() => {
    const unitGroups = new Map()
    resources.forEach((r) => {
      const unitKey = r.unit?.trim() || 'Unsorted'
      if (!unitGroups.has(unitKey)) unitGroups.set(unitKey, new Map())
      const topicGroups = unitGroups.get(unitKey)
      const topicKey = r.topic?.trim() || 'General'
      if (!topicGroups.has(topicKey)) topicGroups.set(topicKey, [])
      topicGroups.get(topicKey).push(r)
    })
    return Array.from(unitGroups.entries()).map(([unit, topicGroups]) => ({
      unit,
      topics: Array.from(topicGroups.entries()),
    }))
  }, [resources])

  const handleDelete = async (id) => {
    await deleteResource(id)
    removeFromList(id)
  }

  return (
    <div>
      <header className="sticky top-0 z-20 bg-base/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={openSidebar}
              aria-label="Open menu"
              className="lg:hidden text-ink-muted hover:text-ink transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => navigate('/notes')}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors shrink-0"
            >
              <ArrowLeft size={16} />
              Notes
            </button>
            <div className="min-w-0 ml-1">
              <h1 className="font-display text-lg font-semibold text-ink truncate">{subject}</h1>
              <p className="text-[11px] text-ink-faint eyebrow">SEMESTER {semester}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <SearchBar value={search} onChange={setSearch} placeholder={`Search in ${subject}...`} />
            <div className="flex items-center gap-1 rounded-lg border border-white/10 p-0.5 shrink-0">
              <button
                onClick={() => setView('grid')}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
                className={`p-1.5 rounded-md transition-colors ${
                  view === 'grid' ? 'bg-primary/20 text-primary-light' : 'text-ink-faint hover:text-ink-muted'
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setView('list')}
                aria-label="List view"
                aria-pressed={view === 'list'}
                className={`p-1.5 rounded-md transition-colors ${
                  view === 'list' ? 'bg-primary/20 text-primary-light' : 'text-ink-faint hover:text-ink-muted'
                }`}
              >
                <List size={15} />
              </button>
            </div>
            {userCanUpload && (
              <button
                onClick={() => setUploadOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-3.5 py-2 text-xs font-medium text-white shadow-glow shrink-0"
              >
                <Plus size={14} />
                Upload
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {loading ? (
          <ResourceGrid resources={[]} loading view={view} />
        ) : resources.length === 0 ? (
          <ResourceGrid
            resources={[]}
            loading={false}
            emptyTitle={`No resources in ${subject} yet`}
            emptyDescription="Upload the first note or resource for this subject."
          />
        ) : (
          grouped.map(({ unit, topics }) => (
            <section key={unit}>
              <h2 className="font-display text-[15px] font-semibold text-ink mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-light" />
                {unit}
              </h2>
              <div className="space-y-7 pl-3.5 border-l border-white/[0.06]">
                {topics.map(([topic, items]) => (
                  <div key={topic}>
                    <h3 className="font-display text-[12px] font-medium text-ink-muted eyebrow mb-3.5">
                      {topic}
                    </h3>
                    <ResourceGrid
                      resources={items}
                      loading={false}
                      view={view}
                      currentUserId={user?.id}
                      currentUserRole={user?.role}
                      onToggleBookmark={toggleBookmark}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={refetch}
        initialValues={{ semester, subject }}
      />
    </div>
  )
}
