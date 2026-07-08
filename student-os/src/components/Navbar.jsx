import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'About', href: '#why' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-base/70 backdrop-blur-xl border-b border-white/[0.07] shadow-[0_1px_0_0_rgba(255,255,255,0.03)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav
        aria-label="Primary"
        className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-16"
      >
        <a href="#top" className="flex items-center gap-2 group">
          <span className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors">
            <Layers size={16} className="text-primary-light" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
            Student<span className="text-primary-light">OS</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-9">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-ink-muted hover:text-ink transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-ink-muted hover:text-ink transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors rounded-lg px-4 py-2 shadow-glow"
          >
            Get Started
          </Link>
        </div>

        <button
          className="md:hidden text-ink p-2 -mr-2"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-base/95 backdrop-blur-xl border-b border-white/[0.07]"
          >
            <div className="px-6 py-5 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="h-px bg-white/[0.07] my-1" />
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="text-sm text-ink-muted hover:text-ink transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors rounded-lg px-4 py-2.5 text-center shadow-glow"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
