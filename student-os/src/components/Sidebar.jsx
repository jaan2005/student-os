import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  Bookmark,
  Bot,
  User,
  Settings,
  LogOut,
  Layers,
  Shield,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES, ROLE_LABELS } from '../constants/roles.js'

const baseNavItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Notes & Resources', to: '/notes', icon: BookOpen },
  { label: 'Bookmarks', to: '/bookmarks', icon: Bookmark },
  { label: 'AI Study Assistant', icon: Bot, disabled: true },
  { label: 'Profile', to: '/profile-setup', icon: User },
  { label: 'Settings', icon: Settings, disabled: true },
]

const ROLE_BADGE_STYLES = {
  [ROLES.STUDENT]: 'text-ink-faint bg-white/[0.04] border-white/[0.08]',
  [ROLES.TRUSTED_CONTRIBUTOR]: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20',
  [ROLES.ADMIN]: 'text-primary-light bg-primary/10 border-primary/25',
}

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()

  const navItems =
    user?.role === ROLES.ADMIN
      ? [...baseNavItems, { label: 'Admin', to: '/admin/users', icon: Shield }]
      : baseNavItems

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-white/[0.06] shrink-0">
        <span className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Layers size={16} className="text-primary-light" />
        </span>
        <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
          Student<span className="text-primary-light">OS</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {navItems.map((item) =>
          item.disabled ? (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-ink-faint cursor-not-allowed select-none"
            >
              <span className="flex items-center gap-3 text-sm">
                <item.icon size={17} />
                {item.label}
              </span>
              <span className="eyebrow text-[9px] bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded">
                SOON
              </span>
            </div>
          ) : (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors border ${
                  isActive
                    ? 'bg-primary/15 text-ink border-primary/25'
                    : 'text-ink-muted hover:text-ink hover:bg-white/[0.04] border-transparent'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <div className="p-3 border-t border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[11px] font-medium text-primary-light shrink-0">
            {initials || <User size={14} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-ink truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-ink-faint truncate">{user?.email}</p>
          </div>
        </div>

        {user?.role && (
          <div className="flex items-center justify-between gap-2 px-1 mb-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border ${ROLE_BADGE_STYLES[user.role]}`}
            >
              {ROLE_LABELS[user.role] || user.role}
            </span>
            {user.role === ROLES.TRUSTED_CONTRIBUTOR && (
              <span className="text-[10px] text-ink-faint eyebrow">
                {user.monthlyUploadCount}/{user.monthlyUploadLimit} UPLOADS
              </span>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-white/[0.04] transition-colors"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col bg-base-card/60 border-r border-white/[0.06] backdrop-blur-xl z-30">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 w-72 bg-base-card border-r border-white/[0.08] z-50 lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="absolute top-4 right-4 text-ink-faint hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
