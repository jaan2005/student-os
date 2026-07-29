import api from '../lib/api.js'

export function fetchUsers(search) {
  return api
    .get('/admin/users', { params: search ? { search } : undefined })
    .then((res) => res.data.users)
}

export function updateUserRole(userId, role) {
  return api.patch(`/admin/users/${userId}/role`, { role }).then((res) => res.data.user)
}

export function updateCareerAccess(userId, canUploadCareer) {
  return api.patch(`/admin/users/${userId}/career-access`, { canUploadCareer }).then((res) => res.data.user)
}

export function fetchPendingCareerResources() {
  return api.get('/admin/career-resources/pending').then((res) => res.data.resources)
}

export function approveCareerResource(resourceId) {
  return api.patch(`/admin/career-resources/${resourceId}/approve`).then((res) => res.data.resource)
}

export function rejectCareerResource(resourceId) {
  return api.patch(`/admin/career-resources/${resourceId}/reject`).then((res) => res.data.resource)
}
