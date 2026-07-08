import { AnimatePresence } from 'framer-motion'
import { FileQuestion } from 'lucide-react'
import ResourceCard from './ResourceCard.jsx'
import LoadingSkeleton from './LoadingSkeleton.jsx'
import EmptyState from './EmptyState.jsx'

export default function ResourceGrid({
  resources,
  loading,
  view = 'grid',
  currentUserId,
  currentUserRole,
  onToggleBookmark,
  onDelete,
  emptyTitle = 'No resources found',
  emptyDescription = 'Try adjusting your search or filters.',
}) {
  if (loading) return <LoadingSkeleton variant={view} count={8} />

  if (!resources.length) {
    return <EmptyState icon={FileQuestion} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className={view === 'list' ? 'space-y-3' : 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}>
      <AnimatePresence initial={false}>
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            view={view}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onToggleBookmark={onToggleBookmark}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
