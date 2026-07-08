export const ROLES = {
  STUDENT: 'student',
  TRUSTED_CONTRIBUTOR: 'trustedContributor',
  ADMIN: 'admin',
}

export const ALL_ROLES = Object.values(ROLES)

// Roles allowed to upload resources (students cannot).
export const UPLOAD_ROLES = [ROLES.TRUSTED_CONTRIBUTOR, ROLES.ADMIN]

// Configurable via env rather than hardcoded — falls back to 10 if unset/invalid.
const parsedLimit = parseInt(process.env.MAX_MONTHLY_UPLOADS, 10)
export const MAX_MONTHLY_UPLOADS = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10
