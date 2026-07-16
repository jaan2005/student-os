import api from '../lib/api.js'

/**
 * GET /api/resources
 * params: { search, semester, subject, fileType, sort, page, limit, ids }
 */
export function fetchResources(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  return api.get('/resources', { params: cleaned }).then((res) => res.data)
}

export function fetchResourceById(id) {
  return api.get(`/resources/${id}`).then((res) => res.data.resource)
}

/**
 * Fetches the file as a Blob (not a URL) so the request goes through our
 * normal authenticated API client rather than a direct, unauthenticated
 * Cloudinary URL — also increments the resource's download counter
 * server-side. Pair with lib/downloadBlob.js to actually save it.
 */
export function downloadResource(id) {
  return api.get(`/resources/${id}/download`, { responseType: 'blob' }).then((res) => res.data)
}

/**
 * Uploads a resource. Returns { status: 'success' | 'duplicate', resource }.
 * onProgress(percent) is called during upload if provided.
 */
export function uploadResource(formValues, file, onProgress) {
  const formData = new FormData()
  Object.entries(formValues).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value)
  })
  formData.append('file', file)

  return api
    .post('/resources/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return
        onProgress(Math.round((event.loaded / event.total) * 100))
      },
    })
    .then((res) => res.data)
}

export function updateResource(id, updates) {
  return api.put(`/resources/${id}`, updates).then((res) => res.data.resource)
}

export function deleteResource(id) {
  return api.delete(`/resources/${id}`).then((res) => res.data)
}

export function fetchSubjects(semester) {
  return api
    .get('/subjects', { params: semester ? { semester } : undefined })
    .then((res) => res.data.subjects)
}

export function fetchBookmarks() {
  return api.get('/bookmarks').then((res) => res.data.resources)
}

export function addBookmark(resourceId) {
  return api.post(`/bookmarks/${resourceId}`).then((res) => res.data)
}

export function removeBookmark(resourceId) {
  return api.delete(`/bookmarks/${resourceId}`).then((res) => res.data)
}
