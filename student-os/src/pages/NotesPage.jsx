import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, TrendingUp, Clock, FolderOpen, Sparkles } from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import Filters from '../components/Filters.jsx'
import ResourceGrid from '../components/ResourceGrid.jsx'
import SubjectCard from '../components/SubjectCard.jsx'
import LoadingSkeleton from '../components/LoadingSkeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'
import UploadModal from '../components/UploadModal.jsx'
import useResources from '../hooks/useResources.js'
import useDebounce from '../hooks/useDebounce.js'
import { useAuth } from '../context/AuthContext.jsx'
import { canUpload } from '../constants/roles.js'
import { fetchSubjects, deleteResource } from '../services/resourceService.js'
import { getRecentlyViewedIds } from '../lib/recentlyViewed.js'

export default function NotesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userCanUpload = canUpload(user?.role)

  const [search, setSearch] = useState('')
  const [semester, setSemester] = useState('')
  const [subject, setSubject] = useState('')
  const [fileType, setFileType] = useState('')
  const [sort, setSort] = useState('newest')
  const [view, setView] = useState('grid')
  const [uploadOpen, setUploadOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 300)
  const isFiltering = Boolean(debouncedSearch || semester || subject || fileType)

  const [subjects, setSubjects] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const recentlyViewedIds = useMemo(() => getRecentlyViewedIds(), [])

  const loadSubjects = async () => {
    setSubjectsLoading(true)
    try {
      const data = await fetchSubjects()
      setSubjects(data)
    } finally {
      setSubjectsLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  const subjectOptions = useMemo(() => {
    const names = subjects.filter((s) => !semester || s.semester === semester).map((s) => s.subject)
    return Array.from(new Set(names)).sort()
  }, [subjects, semester])

  const filteredResults = useResources(
    { search: debouncedSearch, semester, subject, fileType, sort, limit: 24 },
    { enabled: isFiltering }
  )
  const recentUploads = useResources({ sort: 'newest', limit: 6 }, { enabled: !isFiltering })
  const popular = useResources({ sort: 'popular', limit: 6 }, { enabled: !isFiltering })
  const recentlyViewed = useResources(
    { ids: recentlyViewedIds.join(','), limit: recentlyViewedIds.length || 1 },
    { enabled: !isFiltering && recentlyViewedIds.length > 0 }
  )

  const handleUploadSuccess = () => {
    loadSubjects()
    recentUploads.refetch()
    popular.refetch()
    if (isFiltering) filteredResults.refetch()
  }

  const handleDelete = async (id, listHook) => {
    await deleteResource(id)
    listHook.removeFromList(id)
    loadSubjects()
  }

  const filtersNode = (
    <Filters
      semester={semester}
      onSemesterChange={setSemester}
      subject={subject}
      onSubjectChange={setSubject}
      subjectOptions={subjectOptions}
      fileType={fileType}
      onFileTypeChange={setFileType}
      sort={sort}
      onSortChange={setSort}
    />
  )

  return (
    <div>
      <Topbar
        search={search}
        onSearchChange={setSearch}
        filters={filtersNode}
        view={view}
        onViewChange={setView}
        onUploadClick={userCanUpload ? () => setUploadOpen(true) : undefined}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {isFiltering ? (
          <section>
            <p className="text-sm text-ink-muted mb-5">
              {filteredResults.loading
                ? 'Searching…'
                : `${filteredResults.pagination?.total ?? filteredResults.resources.length} result${
                    filteredResults.resources.length === 1 ? '' : 's'
                  }`}
            </p>
            <ResourceGrid
              resources={filteredResults.resources}
              loading={filteredResults.loading}
              view={view}
              currentUserId={user?.id}
                currentUserRole={user?.role}
              onToggleBookmark={filteredResults.toggleBookmark}
              onDelete={(id) => handleDelete(id, filteredResults)}
              emptyTitle="No resources match your search"
              emptyDescription="Try a different keyword, or clear a filter to broaden the results."
            />
          </section>
        ) : (
          <>
            {userCanUpload && (
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setUploadOpen(true)}
                className="w-full flex items-center gap-4 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.06] hover:bg-primary/[0.1] transition-colors p-5 text-left"
              >
                <span className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                  <Upload size={19} className="text-primary-light" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">Upload a resource</p>
                  <p className="text-[13px] text-ink-muted">
                    Share notes, slides, or references with the rest of Student OS.
                  </p>
                </div>
              </motion.button>
            )}

            <Section icon={Clock} title="Recent Uploads">
              <ResourceGrid
                resources={recentUploads.resources}
                loading={recentUploads.loading}
                currentUserId={user?.id}
                currentUserRole={user?.role}
                onToggleBookmark={recentUploads.toggleBookmark}
                onDelete={(id) => handleDelete(id, recentUploads)}
                emptyTitle="No resources yet"
                emptyDescription="Be the first to upload a note or resource."
              />
            </Section>

            <Section icon={TrendingUp} title="Popular Resources">
              <ResourceGrid
                resources={popular.resources}
                loading={popular.loading}
                currentUserId={user?.id}
                currentUserRole={user?.role}
                onToggleBookmark={popular.toggleBookmark}
                onDelete={(id) => handleDelete(id, popular)}
                emptyTitle="Nothing popular yet"
                emptyDescription="Downloads and bookmarks will surface the most useful resources here."
              />
            </Section>

            {recentlyViewedIds.length > 0 && (
              <Section icon={Sparkles} title="Recently Viewed">
                <ResourceGrid
                  resources={recentlyViewed.resources}
                  loading={recentlyViewed.loading}
                  currentUserId={user?.id}
                currentUserRole={user?.role}
                  onToggleBookmark={recentlyViewed.toggleBookmark}
                  onDelete={(id) => handleDelete(id, recentlyViewed)}
                  emptyTitle="Nothing viewed recently"
                />
              </Section>
            )}

            <Section icon={FolderOpen} title="Subject-wise Organization">
              {subjectsLoading ? (
                <LoadingSkeleton count={4} />
              ) : subjects.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No subjects yet"
                  description="Once resources are uploaded, they'll be organized here by semester and subject."
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {subjects.map((s) => (
                    <SubjectCard
                      key={`${s.semester}-${s.subject}`}
                      subject={s.subject}
                      semester={s.semester}
                      totalResources={s.totalResources}
                      lastUpdated={s.lastUpdated}
                      onClick={() => navigate(`/notes/${s.semester}/${encodeURIComponent(s.subject)}`)}
                    />
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={handleUploadSuccess} />
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <Icon size={15} className="text-primary-light" />
        <h2 className="font-display text-[15px] font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  )
}
