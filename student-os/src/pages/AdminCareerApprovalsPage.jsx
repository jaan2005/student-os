import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, ClipboardCheck, Check, X, ExternalLink, Loader2 } from 'lucide-react'
import { fetchPendingCareerResources, approveCareerResource, rejectCareerResource } from '../services/adminService.js'
import { getFileTypeMeta, formatDate } from '../lib/format.js'
import LoadingSkeleton from '../components/LoadingSkeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function AdminCareerApprovalsPage() {
  const { openSidebar } = useOutletContext() || {}

  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPendingCareerResources()
      setResources(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load pending Career Resources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDecision = async (resource, decision) => {
    setBusyId(resource.id)
    try {
      if (decision === 'approve') await approveCareerResource(resource.id)
      else await rejectCareerResource(resource.id)
      // The queue only ever shows pending items — once decided, it just
      // drops out of this list (approved/rejected resources live on the
      // Career Resources page / the uploader's own view instead).
      setResources((prev) => prev.filter((r) => r.id !== resource.id))
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update this resource. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <header className="sticky top-0 z-20 bg-base/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3">
          <button
            onClick={openSidebar}
            aria-label="Open menu"
            className="lg:hidden text-ink-muted hover:text-ink transition-colors shrink-0"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <ClipboardCheck size={17} className="text-primary-light" />
            <h1 className="font-display text-lg font-semibold text-ink">Career Resources — Pending Approval</h1>
          </div>
          {resources.length > 0 && (
            <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
              {resources.length} waiting
            </span>
          )}
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {error && <p className="text-sm text-red-400">{error}</p>}

        {loading ? (
          <LoadingSkeleton variant="list" count={4} />
        ) : resources.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Nothing waiting on review"
            description="Every submitted Career Resource has been approved or rejected."
          />
        ) : (
          <AnimatePresence initial={false}>
            {resources.map((resource, i) => {
              const { icon: Icon, color, bg, border } = getFileTypeMeta(resource.resourceType)
              const isBusy = busyId === resource.id
              const uploaderName = resource.uploadedBy
                ? `${resource.uploadedBy.firstName} ${resource.uploadedBy.lastName}`.trim() || 'Unknown'
                : 'Unknown'

              return (
                <motion.div
                  key={resource.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                  className="rounded-2xl border border-white/[0.07] bg-base-card/40 p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className={`w-11 h-11 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
                      <Icon size={19} className={color} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{resource.title}</p>
                      {resource.description && (
                        <p className="mt-1 text-[13px] text-ink-muted leading-relaxed">{resource.description}</p>
                      )}
                      <p className="mt-2 text-[11px] text-ink-faint">
                        Submitted by {uploaderName} · {formatDate(resource.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <a
                      href={resource.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-colors px-3.5 py-2 text-xs font-medium text-ink"
                    >
                      <ExternalLink size={13} />
                      Preview File
                    </a>
                    <button
                      onClick={() => handleDecision(resource, 'reject')}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors px-3.5 py-2 text-xs font-medium disabled:opacity-50"
                    >
                      {isBusy ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                      Reject
                    </button>
                    <button
                      onClick={() => handleDecision(resource, 'approve')}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-3.5 py-2 text-xs font-medium text-white shadow-glow disabled:opacity-70"
                    >
                      {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Approve
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
