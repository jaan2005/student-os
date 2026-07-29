export const ROLES = {
  STUDENT: 'student',
  TRUSTED_CONTRIBUTOR: 'trustedContributor',
  ADMIN: 'admin',
}

export const ALL_ROLES = Object.values(ROLES)

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.TRUSTED_CONTRIBUTOR]: 'Trusted Contributor',
  [ROLES.ADMIN]: 'Admin',
}

export function canUpload(role) {
  return role === ROLES.TRUSTED_CONTRIBUTOR || role === ROLES.ADMIN
}

// Career Resources upload access is a separate, admin-granted permission
// (User.canUploadCareer), independent of the academic trustedContributor
// role — a plain student can have it, a trustedContributor might not.
// Admins can always upload Career Resources regardless of the flag.
export function canUploadCareer(user) {
  if (!user) return false
  return user.role === ROLES.ADMIN || !!user.canUploadCareer
}
