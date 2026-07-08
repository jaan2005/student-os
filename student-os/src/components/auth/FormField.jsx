export default function FormField({
  id,
  label,
  type = 'text',
  icon: Icon,
  error,
  ...inputProps
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-ink-muted mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
          />
        )}
        <input
          id={id}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-lg bg-white/[0.03] border ${
            error ? 'border-red-500/50' : 'border-white/10'
          } ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary/60 focus:bg-white/[0.05] transition-colors`}
          {...inputProps}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
