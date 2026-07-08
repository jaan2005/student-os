import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function PasswordField({ id, label, error, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-ink-muted mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Lock
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
        />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-lg bg-white/[0.03] border ${
            error ? 'border-red-500/50' : 'border-white/10'
          } pl-10 pr-11 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 focus:bg-white/[0.05] transition-colors`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted transition-colors"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
