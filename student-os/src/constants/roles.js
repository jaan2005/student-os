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
