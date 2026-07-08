import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Search resources...' }) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search resources"
        className="w-full rounded-lg bg-white/[0.03] border border-white/10 pl-10 pr-9 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 focus:bg-white/[0.05] transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted transition-colors"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
