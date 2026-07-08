import { Layers, Twitter, Github, Linkedin } from 'lucide-react'

const links = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Roadmap', href: '#roadmap' },
    { label: 'About', href: '#why' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <a href="#top" className="inline-flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Layers size={16} className="text-primary-light" />
              </span>
              <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
                Student<span className="text-primary-light">OS</span>
              </span>
            </a>
            <p className="mt-4 text-sm text-ink-muted max-w-xs leading-relaxed">
              The AI-powered operating system that takes you from admission to graduation — one
              connected workspace for your entire academic journey.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="w-9 h-9 rounded-lg border border-white/[0.08] flex items-center justify-center text-ink-faint hover:text-ink hover:border-white/20 transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <p className="eyebrow text-[11px] text-ink-faint mb-4">{heading.toUpperCase()}</p>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-ink-muted hover:text-ink transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} Student OS. All rights reserved.
          </p>
          <p className="text-xs text-ink-faint eyebrow">MADE FOR STUDENTS, EVERYWHERE</p>
        </div>
      </div>
    </footer>
  )
}
