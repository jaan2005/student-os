export function AISectionHeading({ children }) {
  return <p className="eyebrow text-[10px] text-primary-light mb-2">{children}</p>
}

export function AIBulletList({ items }) {
  if (!items?.length) return null
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] text-ink-muted leading-relaxed">
          <span className="w-1 h-1 rounded-full bg-primary-light mt-2 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  )
}

export function AIPillList({ items }) {
  if (!items?.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="text-[11px] text-primary-light bg-primary/10 rounded-full px-2.5 py-1">
          {item}
        </span>
      ))}
    </div>
  )
}
