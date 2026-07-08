import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  BookOpen,
  FileQuestion,
  FolderKanban,
  Sparkles,
  CheckCircle2,
  Search,
  Flame,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* background layers */}
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_20%,transparent_75%)]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/20 blur-[140px]" />
      <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-accent-violet/10 blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: copy */}
        <div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 mb-7"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-light opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-light" />
            </span>
            <span className="eyebrow text-[11px] text-ink-muted">🚀 BUILDING IN PUBLIC</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="font-display text-[2.5rem] leading-[1.08] sm:text-5xl sm:leading-[1.08] lg:text-[3.4rem] lg:leading-[1.06] font-semibold tracking-tight text-ink"
          >
            The AI-powered <span className="text-gradient">operating system</span> every student needs.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-6 text-lg text-ink-muted max-w-xl leading-relaxed"
          >
            Organize notes, learn faster with AI, generate quizzes from PDFs, and manage your
            entire academic journey in one place.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-6 py-3 text-sm font-medium text-white shadow-glow-lg"
            >
              Get Started
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-colors px-6 py-3 text-sm font-medium text-ink"
            >
              Sign In
            </Link>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-8 text-xs text-ink-faint eyebrow"
          >
            NO CREDIT CARD · FREE FOREVER PLAN
          </motion.p>
        </div>

        {/* Right: dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[520px]"
        >
          {/* floating badge: quiz generated */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-6 -left-6 z-20 glass rounded-xl px-3.5 py-2.5 flex items-center gap-2 shadow-card hidden sm:flex"
          >
            <CheckCircle2 size={16} className="text-primary-light" />
            <span className="text-xs text-ink">Quiz generated · 12 Qs</span>
          </motion.div>

          {/* floating badge: streak */}
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-7 -right-4 z-20 glass rounded-xl px-3.5 py-2.5 flex items-center gap-2 shadow-card hidden sm:flex"
          >
            <Flame size={16} className="text-orange-400" />
            <span className="text-xs text-ink">7 day streak</span>
          </motion.div>

          {/* main panel */}
          <div className="relative rounded-2xl glass shadow-glow-lg overflow-hidden">
            {/* window bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <div className="ml-3 flex items-center gap-1.5 text-[11px] text-ink-faint eyebrow">
                <Search size={11} />
                studentos.app/dashboard
              </div>
            </div>

            <div className="flex">
              {/* sidebar */}
              <div className="hidden sm:flex w-14 sm:w-16 flex-col items-center gap-4 py-5 border-r border-white/[0.06]">
                {[BookOpen, Bot, FileQuestion, FolderKanban].map((Icon, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      i === 1 ? 'bg-primary/20 text-primary-light border border-primary/30' : 'text-ink-faint'
                    }`}
                  >
                    <Icon size={15} />
                  </div>
                ))}
              </div>

              {/* main content */}
              <div className="flex-1 p-5 space-y-4">
                <div>
                  <p className="text-[13px] text-ink font-medium">Welcome back, Aria 👋</p>
                  <p className="text-[11px] text-ink-faint mt-0.5">Here's your study snapshot</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <p className="text-[10px] text-ink-faint eyebrow">NOTES</p>
                    <p className="text-lg font-display font-semibold text-ink mt-1">128</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <p className="text-[10px] text-ink-faint eyebrow">QUIZZES</p>
                    <p className="text-lg font-display font-semibold text-ink mt-1">42</p>
                  </div>
                </div>

                <div className="rounded-xl bg-primary/[0.08] border border-primary/20 p-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-primary/25 flex items-center justify-center">
                      <Sparkles size={11} className="text-primary-light" />
                    </span>
                    <span className="text-[11px] text-ink font-medium">AI Study Assistant</span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    "Summarize chapter 4 of Organic Chemistry and quiz me on reaction
                    mechanisms."
                  </p>
                  <div className="h-1.5 w-2/3 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full bg-primary-light"
                      initial={{ width: '10%' }}
                      animate={{ width: '85%' }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
