import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, TrendingUp, Clock, Sparkles } from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import Filters from '../components/Filters.jsx'
import ResourceGrid from '../components/ResourceGrid.jsx'
import UploadModal from '../components/UploadModal.jsx'
import useResources from '../hooks/useResources.js'
import useDebounce from '../hooks/useDebounce.js'
import { useAuth } from '../context/AuthContext.jsx'
import { canUploadCareer } from '../constants/roles.js'
import { deleteResource } from '../services/resourceService.js'
import { getRecentlyViewedIds } from '../lib/recentlyViewed.js'

// Career Resources is intentionally not organized by semester/subject the
// way Notes & Resources is (see CareerResourcesPage vs NotesPage) — it's
// visible across every college and isn't structured around a syllabus, so
// there's no folder-card section here, just search + browse.
export default function CareerResourcesPage() {
  const { user } = useAuth()
  const userCanUpload = canUploadCareer(user)

  const [search, setSearch] = useState('')
  const [fileType, setFileType] = useState('')
  const [sort, setSort] = useState('newest')
  const [view, setView] = useState('grid')
  const [uploadOpen, setUploadOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 300)
  const isFiltering = Boolean(debouncedSearch || fileType)
  const recentlyViewedIds = useMemo(() => getRecentlyViewedIds('career'), [])

  const filteredResults = useResources(
    { category: 'career', search: debouncedSearch, fileType, sort, limit: 24 },
    { enabled: isFiltering }
  )
  const recentUploads = useResources({ category: 'career', sort: 'newest', limit: 8 }, { enabled: !isFiltering })
  const popular = useResources({ category: 'career', sort: 'popular', limit: 8 }, { enabled: !isFiltering })
  const recentlyViewed = useResources(
    { category: 'career', ids: recentlyViewedIds.join(','), limit: recentlyViewedIds.length || 1 },
    { enabled: !isFiltering && recentlyViewedIds.length > 0 }
  )

  const handleUploadSuccess = () => {
    recentUploads.refetch()
    popular.refetch()
    if (isFiltering) filteredResults.refetch()
  }

  const handleDelete = async (id, listHook) => {
    await deleteResource(id)
    listHook.removeFromList(id)
  }

  const filtersNode = (
    <Filters
      showSemester={false}
      showSubject={false}
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
              emptyTitle="No career resources match your search"
              emptyDescription="Try a different keyword, or clear a filter to broaden the results."
            />
          </section>
        ) : (
          <>
            {userCanUpload ? (
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
                  <p className="text-sm font-medium text-ink">Submit a Career Resource</p>
                  <p className="text-[13px] text-ink-muted">
                    Resume templates, interview experiences, aptitude material — reviewed before it goes live.
                  </p>
                </div>
              </motion.button>
            ) : (
              <div className="rounded-2xl border border-white/[0.07] bg-base-card/40 p-5">
                <p className="text-sm text-ink">Have something worth sharing?</p>
                <p className="mt-1 text-[13px] text-ink-muted leading-relaxed">
                  Career Resources uploads are limited to a small, trusted group so every post stays reliable. Ask an
                  admin for access if you'd like to contribute.
                </p>
              </div>
            )}

            <Section icon={Clock} title="Recently Added">
              <ResourceGrid
                resources={recentUploads.resources}
                loading={recentUploads.loading}
                view={view}
                currentUserId={user?.id}
                currentUserRole={user?.role}
                onToggleBookmark={recentUploads.toggleBookmark}
                onDelete={(id) => handleDelete(id, recentUploads)}
                emptyTitle="No career resources yet"
                emptyDescription="Approved resume templates, interview writeups, and placement material will show up here."
              />
            </Section>

            <Section icon={TrendingUp} title="Popular">
              <ResourceGrid
                resources={popular.resources}
                loading={popular.loading}
                view={view}
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
                  view={view}
                  currentUserId={user?.id}
                  currentUserRole={user?.role}
                  onToggleBookmark={recentlyViewed.toggleBookmark}
                  onDelete={(id) => handleDelete(id, recentlyViewed)}
                  emptyTitle="Nothing viewed recently"
                />
              </Section>
            )}
          </>
        )}
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        category="career"
      />
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
