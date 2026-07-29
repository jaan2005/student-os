import { useNavigate, useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Menu,
  BookOpen,
  Briefcase,
  Bot,
  Bookmark,
  GraduationCap,
  Building2,
  CalendarDays,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import InstallAppBanner from '../components/InstallAppBanner.jsx'

const quickLinks = [
  { icon: BookOpen, title: 'Notes & Resources', description: 'Browse, search, and upload study material.', to: '/notes' },
  {
    icon: Briefcase,
    title: 'Career Resources',
    description: 'Resume templates, interview experiences, and placement material.',
    to: '/career-resources',
  },
  { icon: Bookmark, title: 'Bookmarks', description: 'Everything you\u2019ve saved for later.', to: '/bookmarks' },
  {
    icon: Bot,
    title: 'AI Study Assistant',
    description: 'Open any PDF resource to chat with the Assistant about it.',
    to: '/notes',
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { openSidebar } = useOutletContext() || {}

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_90%_60%_at_50%_0%,#000_30%,transparent_85%)]" />

      <header className="relative sticky top-0 z-20 bg-base/80 backdrop-blur-xl border-b border-white/[0.06] lg:hidden">
        <div className="px-4 h-16 flex items-center gap-3">
          <button
            onClick={openSidebar}
            aria-label="Open menu"
            className="text-ink-muted hover:text-ink transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">Dashboard</span>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow text-xs text-primary-light mb-2">DASHBOARD</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Welcome back, {user?.firstName || 'there'}.
          </h1>
          <p className="mt-2 text-ink-muted text-sm">
            Here&rsquo;s where you left off.
          </p>
        </motion.div>

        <div className="mt-8">
          <InstallAppBanner />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 rounded-2xl glass shadow-card p-6 sm:p-7"
        >
          <p className="eyebrow text-[11px] text-ink-faint mb-4">YOUR PROFILE</p>
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Building2 size={15} className="text-ink-muted" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-ink-faint">College</p>
                <p className="text-sm text-ink truncate">{user?.college || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <GraduationCap size={15} className="text-ink-muted" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-ink-faint">Branch</p>
                <p className="text-sm text-ink truncate">{user?.branch || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <CalendarDays size={15} className="text-ink-muted" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-ink-faint">Semester</p>
                <p className="text-sm text-ink truncate">{user?.semester || '—'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-10">
          <p className="eyebrow text-[11px] text-ink-faint mb-4">JUMP BACK IN</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((item, i) => (
              <motion.button
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => item.to && navigate(item.to)}
                disabled={item.comingSoon}
                className={`text-left rounded-2xl border border-white/[0.07] bg-base-card/50 p-5 transition-colors ${
                  item.comingSoon ? 'cursor-not-allowed opacity-70' : 'hover:border-primary/25 hover:bg-base-card/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <item.icon size={17} className="text-primary-light" />
                  </div>
                  {!item.comingSoon && <ArrowRight size={15} className="text-ink-faint" />}
                </div>
                <p className="mt-4 text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-1 text-[12px] text-ink-faint leading-relaxed">{item.description}</p>
                {item.comingSoon && (
                  <span className="mt-2 inline-block eyebrow text-[10px] text-ink-faint">COMING SOON</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
