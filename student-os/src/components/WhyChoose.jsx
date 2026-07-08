import { motion } from 'framer-motion'
import { Clock, Brain, LayoutGrid } from 'lucide-react'

const reasons = [
  {
    icon: Clock,
    title: 'Save Time',
    description:
      'Stop switching between apps to find your notes, deadlines, and resources. Everything you need loads in one workspace, so study sessions start faster.',
  },
  {
    icon: Brain,
    title: 'Study Smarter',
    description:
      'AI turns your own material into summaries and quizzes, so you spend time understanding concepts instead of re-reading pages.',
  },
  {
    icon: LayoutGrid,
    title: 'Everything in One Place',
    description:
      'Notes, resources, communities, and internships live under one roof — built to follow you from your first lecture to graduation day.',
  },
]

export default function WhyChoose() {
  return (
    <section id="why" className="relative py-24 sm:py-32">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[500px] bg-primary/[0.06] blur-[160px]" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow text-xs text-primary-light mb-3">WHY STUDENT OS</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Designed around how students actually work.
          </h2>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl glass p-8 shadow-card"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-6">
                <reason.icon size={20} className="text-primary-light" />
              </div>
              <h3 className="font-display text-xl font-semibold text-ink">{reason.title}</h3>
              <p className="mt-3 text-[14px] text-ink-muted leading-relaxed">
                {reason.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
