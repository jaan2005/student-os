export const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8']

// Maps to the backend's ALLOWED_MIME_TYPES canonical resourceType values.
export const RESOURCE_TYPES = [
  { value: 'pdf', label: 'PDF' },
  { value: 'doc', label: 'DOC' },
  { value: 'docx', label: 'DOCX' },
  { value: 'ppt', label: 'PPT' },
  { value: 'pptx', label: 'PPTX' },
  { value: 'jpg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
]

export const ACCEPTED_FILE_EXTENSIONS = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png'

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB, mirrors backend/src/middleware/upload.js

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'popular', label: 'Most popular' },
]

export const RECENTLY_VIEWED_KEY = 'studentos_recently_viewed'
export const RECENTLY_VIEWED_LIMIT = 12
