import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, Bookmark, Share2, Trash2, Check, ExternalLink } from 'lucide-react'
import { getFileTypeMeta, formatFileSize, formatDate } from '../lib/format.js'
import { fetchResourceById } from '../services/resourceService.js'

export default function ResourceCard({ resource, currentUserId, currentUserRole, onToggleBookmark, onDelete, view = 'grid' }) {
  const navigate = useNavigate()
  const [shareCopied, setShareCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { icon: Icon, color, bg, border } = getFileTypeMeta(resource.resourceType)
  const isOwner = currentUserId && resource.uploadedBy?.id === currentUserId
  const canDelete = isOwner || currentUserRole === 'admin'
  const uploaderName = resource.uploadedBy
    ? `${resource.uploadedBy.firstName} ${resource.uploadedBy.lastName}`.trim() || 'Unknown'
    : 'Unknown'

  const handleOpen = () => navigate(`/resources/${resource.id}`)

  const handleDownload = async (e) => {
    e.stopPropagation()
    try {
      const fresh = await fetchResourceById(resource.id, { download: true })
      window.open(fresh.cloudinaryUrl, '_blank', 'noopener,noreferrer')
    } catch {
      window.open(resource.cloudinaryUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleBookmark = (e) => {
    e.stopPropagation()
    onToggleBookmark?.(resource)
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/resources/${resource.id}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1800)
    } catch {
      // Clipboard API unavailable — silently no-op rather than throw.
    }
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${resource.title}"? This can\u2019t be undone.`)) return
    setDeleting(true)
    try {
      await onDelete?.(resource.id)
    } finally {
      setDeleting(false)
    }
  }

  if (view === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        onClick={handleOpen}
        className="group flex items-center gap-4 rounded-xl border border-white/[0.07] bg-base-card/40 hover:border-primary/25 hover:bg-base-card/70 p-4 cursor-pointer transition-colors"
      >
        <span className={`w-11 h-11 rounded-lg ${bg} border ${border} flex items-center justify-center shrink-0`}>
          <Icon size={19} className={color} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{resource.title}</p>
          <p className="text-xs text-ink-faint truncate mt-0.5">
            {resource.subject} · Semester {resource.semester}
            {resource.unit ? ` · ${resource.unit}` : ''}
            {resource.topic ? ` · ${resource.topic}` : ''}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton onClick={handleBookmark} active={resource.isBookmarked} label="Bookmark">
            <Bookmark size={15} fill={resource.isBookmarked ? 'currentColor' : 'none'} />
          </IconButton>
          <IconButton onClick={handleDownload} label="Download">
            <Download size={15} />
          </IconButton>
          <IconButton onClick={handleShare} label="Share">
            {shareCopied ? <Check size={15} className="text-primary-light" /> : <Share2 size={15} />}
          </IconButton>
          {canDelete && (
            <IconButton onClick={handleDelete} label="Delete" danger disabled={deleting}>
              <Trash2 size={15} />
            </IconButton>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -4 }}
      onClick={handleOpen}
      className="group relative rounded-2xl border border-white/[0.07] bg-base-card/50 hover:border-primary/25 p-5 cursor-pointer transition-colors shadow-card flex flex-col"
    >
      <div className="flex items-start justify-between">
        <span className={`w-11 h-11 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
          <Icon size={19} className={color} />
        </span>
        <button
          onClick={handleBookmark}
          aria-label={resource.isBookmarked ? 'Remove bookmark' : 'Bookmark resource'}
          className={`p-1.5 rounded-lg transition-colors ${
            resource.isBookmarked ? 'text-primary-light' : 'text-ink-faint hover:text-ink-muted'
          }`}
        >
          <Bookmark size={16} fill={resource.isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <h3 className="mt-4 font-display text-[15px] font-semibold text-ink line-clamp-1">{resource.title}</h3>
      {resource.description && (
        <p className="mt-1.5 text-[13px] text-ink-muted leading-relaxed line-clamp-2">{resource.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <MetaPill>{resource.subject}</MetaPill>
        <MetaPill>Sem {resource.semester}</MetaPill>
        {resource.unit && <MetaPill>{resource.unit}</MetaPill>}
        {resource.topic && <MetaPill>{resource.topic}</MetaPill>}
      </div>

      {resource.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {resource.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] text-primary-light bg-primary/10 rounded-full px-2 py-0.5">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-ink-faint">
        <span className="truncate">{uploaderName}</span>
        <span className="shrink-0">{formatDate(resource.createdAt)}</span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleOpen()
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 border border-primary/25 transition-colors px-3 py-1.5 text-xs font-medium text-primary-light"
        >
          <ExternalLink size={13} />
          Open
        </button>
        <IconButton onClick={handleDownload} label="Download">
          <Download size={14} />
        </IconButton>
        <IconButton onClick={handleShare} label="Share">
          {shareCopied ? <Check size={14} className="text-primary-light" /> : <Share2 size={14} />}
        </IconButton>
        {canDelete && (
          <IconButton onClick={handleDelete} label="Delete" danger disabled={deleting}>
            <Trash2 size={14} />
          </IconButton>
        )}
      </div>

      <span className="sr-only">{formatFileSize(resource.fileSize)}</span>
    </motion.div>
  )
}

function MetaPill({ children }) {
  return (
    <span className="text-[10px] text-ink-muted bg-white/[0.04] border border-white/[0.07] rounded-full px-2 py-0.5">
      {children}
    </span>
  )
}

function IconButton({ children, onClick, label, active, danger, disabled }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
        danger
          ? 'text-red-400 border-red-500/20 hover:bg-red-500/10'
          : active
            ? 'text-primary-light border-primary/25 bg-primary/10'
            : 'text-ink-faint border-white/[0.07] hover:text-ink-muted hover:bg-white/[0.04]'
      }`}
    >
      {children}
    </button>
  )
}
