import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  UploadCloud,
  File as FileIcon,
  Loader2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Bookmark,
} from 'lucide-react'
import { SEMESTERS, RESOURCE_TYPES, ACCEPTED_FILE_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '../constants/resourceOptions.js'
import { uploadResource as uploadResourceRequest, addBookmark } from '../services/resourceService.js'
import { formatFileSize, getFileTypeMeta } from '../lib/format.js'

const EXTENSION_TO_TYPE = {
  pdf: 'pdf',
  doc: 'doc',
  docx: 'docx',
  ppt: 'ppt',
  pptx: 'pptx',
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
}

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']

const emptyForm = {
  title: '',
  description: '',
  semester: '',
  subject: '',
  unit: '',
  topic: '',
  tags: '',
  resourceType: '',
}

export default function UploadModal({ open, onClose, onSuccess, initialValues }) {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({ ...emptyForm, ...initialValues })
  const [file, setFile] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [fileError, setFileError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const [status, setStatus] = useState('form') // 'form' | 'uploading' | 'duplicate' | 'done'
  const [progress, setProgress] = useState(0)
  const [duplicateResource, setDuplicateResource] = useState(null)
  const [bookmarking, setBookmarking] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  const reset = () => {
    setForm({ ...emptyForm, ...initialValues })
    setFile(null)
    setFieldErrors({})
    setFileError('')
    setStatus('form')
    setProgress(0)
    setDuplicateResource(null)
    setBookmarked(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((f) => ({ ...f, [name]: '' }))
  }

  const validateFile = (candidate) => {
    const ext = candidate.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return 'Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG.'
    }
    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      return 'This file exceeds the maximum upload size of 20 MB.'
    }
    return ''
  }

  const handleFileSelect = (candidate) => {
    if (!candidate) return
    const error = validateFile(candidate)
    if (error) {
      setFileError(error)
      setFile(null)
      setForm((f) => ({ ...f, resourceType: '' }))
      return
    }
    setFileError('')
    setFile(candidate)
    const ext = candidate.name.split('.').pop()?.toLowerCase()
    setForm((f) => ({ ...f, resourceType: EXTENSION_TO_TYPE[ext] || '' }))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files?.[0])
  }

  const validate = () => {
    const errors = {}
    if (!form.title.trim()) errors.title = 'Title is required.'
    if (!form.semester) errors.semester = 'Select a semester.'
    if (!form.subject.trim()) errors.subject = 'Subject is required.'
    setFieldErrors(errors)

    let fErr = ''
    if (!file) fErr = 'Choose a file to upload.'
    setFileError((prev) => fErr || prev)

    return Object.keys(errors).length === 0 && file && !fErr
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setStatus('uploading')
    setProgress(0)
    try {
      const data = await uploadResourceRequest(form, file, setProgress)
      if (data.status === 'duplicate') {
        setDuplicateResource(data.resource)
        setStatus('duplicate')
      } else {
        setStatus('done')
        onSuccess?.(data.resource)
        setTimeout(handleClose, 900)
      }
    } catch (err) {
      setStatus('form')
      setFileError(err?.response?.data?.message || 'Upload failed. Please try again.')
    }
  }

  const handleOpenDuplicate = () => {
    navigate(`/resources/${duplicateResource.id}`)
    handleClose()
  }

  const handleBookmarkDuplicate = async () => {
    setBookmarking(true)
    try {
      await addBookmark(duplicateResource.id)
      setBookmarked(true)
    } finally {
      setBookmarking(false)
    }
  }

  if (!open) return null

  const typeMeta = duplicateResource ? getFileTypeMeta(duplicateResource.resourceType) : null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={status === 'uploading' ? undefined : handleClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl glass shadow-glow-lg p-6 sm:p-7"
        >
          {status === 'duplicate' && duplicateResource ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-4">
                <Copy size={20} className="text-primary-light" />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">This resource already exists</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                Instead of uploading another copy, you can open the existing resource.
              </p>

              <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-left">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-lg ${typeMeta.bg} border ${typeMeta.border} flex items-center justify-center shrink-0`}
                  >
                    <typeMeta.icon size={16} className={typeMeta.color} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{duplicateResource.title}</p>
                    <p className="text-[11px] text-ink-faint truncate">
                      {duplicateResource.subject} · Semester {duplicateResource.semester}
                      {duplicateResource.unit ? ` · ${duplicateResource.unit}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleBookmarkDuplicate}
                  disabled={bookmarking || bookmarked}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-colors px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-70"
                >
                  {bookmarked ? (
                    <>
                      <CheckCircle2 size={15} className="text-primary-light" /> Bookmarked
                    </>
                  ) : (
                    <>
                      <Bookmark size={15} /> Bookmark
                    </>
                  )}
                </button>
                <button
                  onClick={handleOpenDuplicate}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-4 py-2.5 text-sm font-medium text-white shadow-glow"
                >
                  <ExternalLink size={15} />
                  Open Resource
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg font-semibold text-ink">Upload Resource</h3>
                <button
                  onClick={handleClose}
                  disabled={status === 'uploading'}
                  aria-label="Close"
                  className="text-ink-faint hover:text-ink transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-xs font-medium text-ink-muted mb-1.5">
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    placeholder="e.g. Memory Management Lecture Notes"
                    className={`w-full rounded-lg bg-white/[0.03] border ${
                      fieldErrors.title ? 'border-red-500/50' : 'border-white/10'
                    } px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 transition-colors`}
                  />
                  {fieldErrors.title && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.title}</p>}
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-medium text-ink-muted mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={onChange}
                    rows={2}
                    placeholder="Optional short summary of this resource"
                    className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="semester" className="block text-xs font-medium text-ink-muted mb-1.5">
                      Semester
                    </label>
                    <select
                      id="semester"
                      name="semester"
                      value={form.semester}
                      onChange={onChange}
                      className={`w-full rounded-lg bg-white/[0.03] border ${
                        fieldErrors.semester ? 'border-red-500/50' : 'border-white/10'
                      } px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary/60 transition-colors`}
                    >
                      <option value="" className="bg-base-card">
                        Select
                      </option>
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s} className="bg-base-card">
                          Semester {s}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.semester && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.semester}</p>}
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-xs font-medium text-ink-muted mb-1.5">
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      value={form.subject}
                      onChange={onChange}
                      placeholder="e.g. Operating Systems"
                      className={`w-full rounded-lg bg-white/[0.03] border ${
                        fieldErrors.subject ? 'border-red-500/50' : 'border-white/10'
                      } px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 transition-colors`}
                    />
                    {fieldErrors.subject && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.subject}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="unit" className="block text-xs font-medium text-ink-muted mb-1.5">
                      Unit
                    </label>
                    <input
                      id="unit"
                      name="unit"
                      value={form.unit}
                      onChange={onChange}
                      placeholder="e.g. Unit 3"
                      className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="topic" className="block text-xs font-medium text-ink-muted mb-1.5">
                      Topic
                    </label>
                    <input
                      id="topic"
                      name="topic"
                      value={form.topic}
                      onChange={onChange}
                      placeholder="e.g. Memory Management"
                      className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-xs font-medium text-ink-muted mb-1.5">
                    Tags
                  </label>
                  <input
                    id="tags"
                    name="tags"
                    value={form.tags}
                    onChange={onChange}
                    placeholder="comma, separated, tags"
                    className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="resourceType" className="block text-xs font-medium text-ink-muted mb-1.5">
                    Resource Type
                  </label>
                  <select
                    id="resourceType"
                    value={form.resourceType}
                    disabled
                    className="w-full rounded-lg bg-white/[0.02] border border-white/10 px-3.5 py-2.5 text-sm text-ink-muted outline-none cursor-not-allowed appearance-none"
                  >
                    <option value="" className="bg-base-card">
                      Choose a file below to detect type
                    </option>
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-base-card">
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-ink-faint">
                    Detected automatically from the file you choose — this keeps the stored type accurate.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">File</label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragActive(true)
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-xl border-2 border-dashed ${
                      dragActive ? 'border-primary/60 bg-primary/[0.06]' : 'border-white/10 hover:border-white/20'
                    } px-4 py-6 text-center cursor-pointer transition-colors`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_FILE_EXTENSIONS}
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      className="hidden"
                    />
                    {file ? (
                      <div className="flex items-center justify-center gap-2.5">
                        <FileIcon size={18} className="text-primary-light" />
                        <span className="text-sm text-ink truncate max-w-[220px]">{file.name}</span>
                        <span className="text-xs text-ink-faint shrink-0">{formatFileSize(file.size)}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-ink-faint">
                        <UploadCloud size={20} />
                        <span className="text-xs">
                          Drag & drop, or <span className="text-primary-light">browse</span>
                        </span>
                        <span className="text-[10px]">PDF, DOC, DOCX, PPT, PPTX, JPG, PNG · up to 20 MB</span>
                      </div>
                    )}
                  </div>
                  {fileError && <p className="mt-1.5 text-xs text-red-400">{fileError}</p>}
                </div>

                {status === 'uploading' && (
                  <div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-light"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: 'easeOut' }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-ink-faint">Uploading… {progress}%</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={status === 'uploading'}
                    className="flex-1 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-colors px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'uploading' || status === 'done'}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-4 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-70"
                  >
                    {status === 'uploading' && <Loader2 size={15} className="animate-spin" />}
                    {status === 'done' && <CheckCircle2 size={15} />}
                    {status === 'uploading' ? 'Uploading' : status === 'done' ? 'Uploaded' : 'Upload'}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
