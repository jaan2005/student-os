import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../Logo.jsx'

/**
 * Two-column shell shared by Signup and Login: a branded glow/grid panel on
 * the left (hidden on small screens), and the actual form card on the right.
 */
export default function AuthShell({ eyebrow, title, subtitle, children }) {
  return (
    <div className="relative min-h-screen bg-base overflow-hidden flex">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_20%,transparent_75%)]" />
      <div className="absolute -top-40 left-1/4 w-[700px] h-[500px] rounded-full bg-primary/20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent-violet/10 blur-[120px]" />

      {/* Left branding panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/[0.06]">
        <Link to="/" className="flex items-center gap-2 group w-fit">
          <span className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors">
            <Logo size={16} className="text-primary-light" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
            Student<span className="text-primary-light">OS</span>
          </span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md"
        >
          <p className="eyebrow text-xs text-primary-light mb-4">{eyebrow}</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink leading-[1.15]">
            {title}
          </h1>
          <p className="mt-4 text-ink-muted text-[15px] leading-relaxed">{subtitle}</p>
        </motion.div>

        <p className="text-xs text-ink-faint eyebrow">
          © {new Date().getFullYear()} STUDENT OS
        </p>
      </div>

      {/* Right form panel */}
      <div className="relative flex-1 flex items-center justify-center px-6 py-16 sm:px-10">
        <Link
          to="/"
          className="lg:hidden absolute top-6 left-6 flex items-center gap-2 group w-fit"
        >
          <span className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Logo size={16} className="text-primary-light" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
            Student<span className="text-primary-light">OS</span>
          </span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="rounded-2xl glass shadow-glow-lg p-8 sm:p-9">{children}</div>
        </motion.div>
      </div>
    </div>
  )
}
