import { Loader2 } from 'lucide-react'

export default function SubmitButton({ loading, children, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors px-4 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-70 disabled:cursor-not-allowed"
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}
