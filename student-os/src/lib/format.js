import { FileText, FileImage, File as FileGeneric, Presentation } from 'lucide-react'

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRelativeDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMins / 60)
  const diffDays = Math.round(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

const TYPE_META = {
  pdf: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  doc: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  docx: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  ppt: { icon: Presentation, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  pptx: { icon: Presentation, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  jpg: { icon: FileImage, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  png: { icon: FileImage, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
}

export function getFileTypeMeta(resourceType) {
  return (
    TYPE_META[resourceType] || {
      icon: FileGeneric,
      color: 'text-ink-faint',
      bg: 'bg-white/[0.04]',
      border: 'border-white/[0.08]',
    }
  )
}
