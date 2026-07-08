import { motion } from 'framer-motion'
import {
  ShieldCheck,
  UserCircle2,
  BookOpen,
  Bot,
  FileQuestion,
  FolderKanban,
  Bookmark,
} from 'lucide-react'

const features = [
  {
    icon: ShieldCheck,
    title: 'Secure Authentication',
    description: 'Enterprise-grade sign-in that keeps your academic identity and data protected at every step.',
  },
  {
    icon: UserCircle2,
    title: 'Student Profile',
    description: 'A single profile that tracks your courses, progress, and achievements across your entire journey.',
  },
  {
    icon: BookOpen,
    title: 'Notes & Resources',
    description: 'Capture, organize, and revisit notes and study resources without ever losing track of a file.',
  },
  {
    icon: Bot,
    title: 'AI Study Assistant',
    description: 'Ask questions, get explanations, and summarize dense material with an assistant that knows your subjects.',
  },
  {
    icon: FileQuestion,
    title: 'AI Quiz Generator',
    description: 'Turn any PDF or note set into a personalized quiz in seconds, ready for exam prep.',
  },
  {
    icon: FolderKanban,
    title: 'Subject-wise Organization',
    description: 'Everything sorted automatically by subject and semester, so your workspace stays effortlessly tidy.',
  },
  {
    icon: Bookmark,
    title: 'Save & Bookmark Notes',
    description: 'Bookmark key notes and resources so the material that matters most is always one click away.',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow text-xs text-primary-light mb-3">FEATURES</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Everything your academic life runs on.
          </h2>
          <p className="mt-4 text-ink-muted text-base leading-relaxed">
            Student OS brings the tools you'd otherwise scatter across a dozen apps into one
            connected workspace.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl bg-base-card/60 border border-white/[0.07] p-6 shadow-card hover:border-primary/30 transition-colors duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                <feature.icon size={19} className="text-primary-light" />
              </div>
              <h3 className="mt-5 font-display text-[17px] font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-[13.5px] text-ink-muted leading-relaxed">
                {feature.description}
              </p>

              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-primary/[0.06] to-transparent" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
