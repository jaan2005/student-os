import api from '../lib/api.js'

export function fetchUsers(search) {
  return api
    .get('/admin/users', { params: search ? { search } : undefined })
    .then((res) => res.data.users)
}

export function updateUserRole(userId, role) {
  return api.patch(`/admin/users/${userId}/role`, { role }).then((res) => res.data.user)
}
