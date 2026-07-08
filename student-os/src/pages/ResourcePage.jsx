import { useEffect, useState } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Menu,
  Eye,
  Download,
  Bookmark,
  Share2,
  Trash2,
  Check,
  Sparkles,
  FileQuestion,
  MessageSquareText,
  Layers as FlashcardsIcon,
  Loader2,
} from 'lucide-react'
import PDFViewer from '../components/PDFViewer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  fetchResourceById,
  addBookmark,
  removeBookmark,
  deleteResource,
} from '../services/resourceService.js'
import { getFileTypeMeta, formatFileSize, formatDate } from '../lib/format.js'
import { buildInlinePreviewUrl } from '../lib/previewUrl.js'
import { recordResourceView } from '../lib/recentlyViewed.js'

const COMING_SOON_ACTIONS = [
  { label: 'Generate Quiz', icon: FileQuestion },
  { label: 'Ask AI', icon: MessageSquareText },
  { label: 'Summarize', icon: Sparkles },
  { label: 'Flashcards', icon: FlashcardsIcon },
]

export default function ResourcePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openSidebar } = useOutletContext() || {}

  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareCopied, setShareCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [bookmarkBusy, setBookmarkBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchResourceById(id)
      .then((data) => {
        if (cancelled) return
        setResource(data)
        recordResourceView(data.id)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.response?.data?.message || 'This resource could not be found.')
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  const handleDownload = async () => {
    try {
      const fresh = await fetchResourceById(id, { download: true })
      setResource(fresh)
      window.open(fresh.cloudinaryUrl, '_blank', 'noopener,noreferrer')
    } catch {
      window.open(resource.cloudinaryUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handlePreview = () => {
    const url = resource.previewUrl || resource.cloudinaryUrl
    window.open(buildInlinePreviewUrl(url, resource.resourceType), '_blank', 'noopener,noreferrer')
  }

  const handleBookmark = async () => {
    setBookmarkBusy(true)
    const wasBookmarked = resource.isBookmarked
    setResource((r) => ({
      ...r,
      isBookmarked: !wasBookmarked,
      bookmarksCount: r.bookmarksCount + (wasBookmarked ? -1 : 1),
    }))
    try {
      if (wasBookmarked) await removeBookmark(id)
      else await addBookmark(id)
    } catch {
      setResource((r) => ({
        ...r,
        isBookmarked: wasBookmarked,
        bookmarksCount: r.bookmarksCount + (wasBookmarked ? 1 : -1),
      }))
    } finally {
      setBookmarkBusy(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1800)
    } catch {
      // no-op if clipboard is unavailable
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${resource.title}"? This can\u2019t be undone.`)) return
    setDeleting(true)
    try {
      await deleteResource(id)
      navigate('/notes', { replace: true })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 size={22} className="text-primary-light animate-spin" />
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <p className="text-sm text-ink">{error || 'This resource could not be found.'}</p>
        <button
          onClick={() => navigate('/notes')}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-4 py-2.5 text-sm font-medium text-white shadow-glow"
        >
          <ArrowLeft size={15} />
          Back to Notes
        </button>
      </div>
    )
  }

  const { icon: Icon, color, bg, border } = getFileTypeMeta(resource.resourceType)
  const isOwner = user?.id && resource.uploadedBy?.id === user.id
  const canDelete = isOwner || user?.role === 'admin'
  const uploaderName = resource.uploadedBy
    ? `${resource.uploadedBy.firstName} ${resource.uploadedBy.lastName}`.trim() || 'Unknown'
    : 'Unknown'

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
          <button
            onClick={() => navigate('/notes')}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} />
            Notes
          </button>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <PDFViewer
            resourceType={resource.resourceType}
            url={resource.previewUrl || resource.cloudinaryUrl}
            title={resource.title}
          />
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl glass shadow-card p-6 space-y-5"
        >
          <div className="flex items-start gap-3">
            <span className={`w-11 h-11 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
              <Icon size={19} className={color} />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-semibold text-ink leading-snug">{resource.title}</h1>
              <p className="text-[11px] text-ink-faint mt-0.5">{formatFileSize(resource.fileSize)}</p>
            </div>
          </div>

          {resource.description && (
            <p className="text-[13px] text-ink-muted leading-relaxed">{resource.description}</p>
          )}

          <dl className="grid grid-cols-2 gap-3 text-[13px]">
            <MetaRow label="Semester" value={`Semester ${resource.semester}`} />
            <MetaRow label="Subject" value={resource.subject} />
            {resource.unit && <MetaRow label="Unit" value={resource.unit} />}
            {resource.topic && <MetaRow label="Topic" value={resource.topic} />}
            <MetaRow label="Uploaded by" value={uploaderName} />
            <MetaRow label="Upload date" value={formatDate(resource.createdAt)} />
          </dl>

          {resource.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <span key={tag} className="text-[11px] text-primary-light bg-primary/10 rounded-full px-2.5 py-1">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <ActionButton onClick={handlePreview} icon={Eye} label="Preview" primary />
            <ActionButton onClick={handleDownload} icon={Download} label="Download" />
            <ActionButton
              onClick={handleBookmark}
              icon={Bookmark}
              label={resource.isBookmarked ? 'Bookmarked' : 'Bookmark'}
              active={resource.isBookmarked}
              disabled={bookmarkBusy}
              filled={resource.isBookmarked}
            />
            <ActionButton
              onClick={handleShare}
              icon={shareCopied ? Check : Share2}
              label={shareCopied ? 'Copied!' : 'Share'}
            />
            {canDelete && (
              <ActionButton onClick={handleDelete} icon={Trash2} label="Delete" danger disabled={deleting} />
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.06]">
            <p className="eyebrow text-[10px] text-ink-faint mb-3">STUDY TOOLS</p>
            <div className="grid grid-cols-2 gap-2.5">
              {COMING_SOON_ACTIONS.map((action) => (
                <div
                  key={action.label}
                  className="relative flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-ink-faint cursor-not-allowed"
                  title="Coming soon"
                >
                  <action.icon size={15} />
                  <span className="text-xs">{action.label}</span>
                  <span className="absolute -top-1.5 -right-1.5 eyebrow text-[8px] bg-base-card border border-white/[0.1] text-ink-faint px-1.5 py-0.5 rounded-full">
                    SOON
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  )
}

function MetaRow({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] text-ink-faint eyebrow">{label.toUpperCase()}</dt>
      <dd className="text-ink mt-0.5 truncate">{value}</dd>
    </div>
  )
}

function ActionButton({ onClick, icon: Icon, label, primary, active, danger, disabled, filled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-colors disabled:opacity-60 ${
        primary
          ? 'bg-primary hover:bg-primary-dark text-white shadow-glow'
          : danger
            ? 'border border-red-500/25 text-red-400 hover:bg-red-500/10'
            : active
              ? 'border border-primary/25 bg-primary/10 text-primary-light'
              : 'border border-white/10 text-ink hover:border-white/20 hover:bg-white/[0.03]'
      }`}
    >
      <Icon size={14} fill={filled ? 'currentColor' : 'none'} />
      {label}
    </button>
  )
}
