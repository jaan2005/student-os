import { motion } from 'framer-motion'
import { CheckCircle2, CircleDot, Circle } from 'lucide-react'

const roadmap = [
  { n: '01', title: 'Secure Authentication', status: 'shipped' },
  { n: '02', title: 'Student Profile', status: 'shipped' },
  { n: '03', title: 'Personalized Dashboard', status: 'shipped' },
  { n: '04', title: 'Notes Sharing', status: 'shipped' },
  { n: '05', title: 'Subject Organization', status: 'shipped' },
  { n: '06', title: 'AI Assistant', status: 'in-progress' },
  { n: '07', title: 'AI Quiz Generator', status: 'shipped' },
  { n: '08', title: 'Bookmark Notes', status: 'shipped' },
]

const statusMeta = {
  shipped: { label: 'Shipped', icon: CheckCircle2, color: 'text-primary-light', dot: 'bg-primary-light' },
  'in-progress': { label: 'In progress', icon: CircleDot, color: 'text-accent-cyan', dot: 'bg-accent-cyan' },
  planned: { label: 'Planned', icon: Circle, color: 'text-ink-faint', dot: 'bg-ink-faint' },
}

export default function Roadmap() {
  return (
    <section id="roadmap" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow text-xs text-primary-light mb-3">VERSION 1 ROADMAP</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Built in public, shipped in order.
          </h2>
          <p className="mt-4 text-ink-muted text-base leading-relaxed">
            Here's the exact sequence we're building Student OS in — from the first login to a
            full AI-powered study workspace.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-2 gap-x-10 gap-y-4">
          {roadmap.map((item, i) => {
            const meta = statusMeta[item.status]
            return (
              <motion.div
                key={item.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-5 rounded-xl border border-white/[0.06] bg-base-card/40 px-5 py-4 hover:border-primary/25 hover:bg-base-card/70 transition-colors"
              >
                <span className="font-mono text-2xl font-medium text-ink-faint/70 tabular-nums w-9 shrink-0">
                  {item.n}
                </span>
                <div className="h-8 w-px bg-white/[0.08] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[15px] font-medium text-ink truncate">
                    {item.title}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 shrink-0 ${meta.color}`}>
                  <meta.icon size={14} />
                  <span className="eyebrow text-[10px]">{meta.label.toUpperCase()}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
