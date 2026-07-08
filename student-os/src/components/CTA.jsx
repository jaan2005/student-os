import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/[0.12] to-base-card/40 px-8 py-16 sm:px-16 sm:py-20 text-center"
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/25 blur-[120px]" />

          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink max-w-2xl mx-auto">
              Start building your better student life today.
            </h2>
            <p className="mt-5 text-ink-muted text-base max-w-lg mx-auto">
              Join students already organizing their academic journey with Student OS — free to
              start, no credit card required.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-6 py-3 text-sm font-medium text-white shadow-glow-lg"
              >
                Create Free Account
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-colors px-6 py-3 text-sm font-medium text-ink"
              >
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
