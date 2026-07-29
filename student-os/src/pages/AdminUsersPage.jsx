import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, Shield, Search, Users as UsersIcon, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchUsers, updateUserRole, updateCareerAccess } from '../services/adminService.js'
import { ROLES, ALL_ROLES, ROLE_LABELS } from '../constants/roles.js'
import useDebounce from '../hooks/useDebounce.js'
import LoadingSkeleton from '../components/LoadingSkeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'

const ROLE_BADGE_STYLES = {
  [ROLES.STUDENT]: 'text-ink-muted bg-white/[0.04] border-white/[0.08]',
  [ROLES.TRUSTED_CONTRIBUTOR]: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20',
  [ROLES.ADMIN]: 'text-primary-light bg-primary/10 border-primary/25',
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const { openSidebar } = useOutletContext() || {}

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchUsers(debouncedSearch)
      setUsers(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const handleRoleChange = async (targetUser, role) => {
    if (role === targetUser.role) return
    setUpdatingId(targetUser.id)
    const previous = targetUser.role
    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role } : u)))
    try {
      await updateUserRole(targetUser.id, role)
    } catch (err) {
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: previous } : u)))
      setError(err?.response?.data?.message || 'Could not update role.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCareerAccessToggle = async (targetUser) => {
    const next = !targetUser.canUploadCareer
    setUpdatingId(targetUser.id)
    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, canUploadCareer: next } : u)))
    try {
      await updateCareerAccess(targetUser.id, next)
    } catch (err) {
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, canUploadCareer: !next } : u)))
      setError(err?.response?.data?.message || 'Could not update Career Resources access.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <header className="sticky top-0 z-20 bg-base/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3">
          <button
            onClick={openSidebar}
            aria-label="Open menu"
            className="lg:hidden text-ink-muted hover:text-ink transition-colors shrink-0"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={17} className="text-primary-light" />
            <h1 className="font-display text-lg font-semibold text-ink">User Management</h1>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg bg-white/[0.03] border border-white/10 pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 focus:bg-white/[0.05] transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {loading ? (
          <LoadingSkeleton variant="list" count={6} />
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users found" description="Try a different search term." />
        ) : (
          <div className="rounded-2xl border border-white/[0.07] bg-base-card/40 overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_140px_140px_140px_160px] gap-4 px-5 py-3 text-[11px] text-ink-faint eyebrow border-b border-white/[0.06]">
              <span>USER</span>
              <span>ROLE</span>
              <span>UPLOADS THIS MONTH</span>
              <span>CAREER ACCESS</span>
              <span>CHANGE ROLE</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {users.map((u, i) => {
                const isSelf = u.id === currentUser?.id
                const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase()

                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                    className="grid sm:grid-cols-[1fr_140px_140px_140px_160px] gap-4 px-5 py-4 items-center"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[11px] font-medium text-primary-light shrink-0">
                        {initials || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-ink truncate">
                          {u.firstName} {u.lastName}
                          {isSelf && <span className="text-ink-faint"> (you)</span>}
                        </p>
                        <p className="text-[12px] text-ink-faint truncate">{u.email}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center text-[11px] px-2.5 py-1 rounded-full border ${ROLE_BADGE_STYLES[u.role]}`}
                    >
                      {ROLE_LABELS[u.role] || u.role}
                    </span>

                    <span className="text-[13px] text-ink-muted">
                      {u.role === ROLES.STUDENT ? '—' : `${u.monthlyUploadCount} / ${u.monthlyUploadLimit}`}
                    </span>

                    <button
                      onClick={() => handleCareerAccessToggle(u)}
                      disabled={u.role === ROLES.ADMIN || updatingId === u.id}
                      title={
                        u.role === ROLES.ADMIN
                          ? 'Admins can always upload Career Resources'
                          : 'Grant or revoke Career Resources upload access'
                      }
                      className={`inline-flex w-fit items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        u.role === ROLES.ADMIN || u.canUploadCareer
                          ? 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20'
                          : 'text-ink-faint bg-white/[0.04] border-white/[0.08] hover:text-ink-muted'
                      }`}
                    >
                      <Briefcase size={11} />
                      {u.role === ROLES.ADMIN || u.canUploadCareer ? 'Enabled' : 'Disabled'}
                    </button>

                    <select
                      value={u.role}
                      disabled={isSelf || updatingId === u.id}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      className="rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-2 text-xs text-ink outline-none focus:border-primary/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ALL_ROLES.map((role) => (
                        <option key={role} value={role} className="bg-base-card">
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
