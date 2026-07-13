/**
 * The Student OS mark: a simplified browser/app-window frame — a direct,
 * literal nod to the "OS" in the name that no generic study-app icon would
 * reach for. Drawn in the same visual language as the Lucide icons used
 * everywhere else in the app (24x24 viewBox, strokeWidth 2, round caps) so
 * it drops into the exact same `w-8 h-8 rounded-lg bg-primary/15
 * border-primary/30` containers used throughout, with the same `size`/
 * `className` prop API as any lucide-react icon it's replacing.
 */
export default function Logo({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <circle cx="6.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}
