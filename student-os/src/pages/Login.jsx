import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getAuthErrorMessage } from '../lib/authErrors.js'
import AuthShell from '../components/auth/AuthShell.jsx'
import FormField from '../components/auth/FormField.jsx'
import PasswordField from '../components/auth/PasswordField.jsx'
import ErrorBanner from '../components/auth/ErrorBanner.jsx'
import SubmitButton from '../components/auth/SubmitButton.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((f) => ({ ...f, [name]: '' }))
  }

  const routeAfterAuth = (user) => {
    const fallback = user?.profileCompleted ? '/dashboard' : '/profile-setup'
    navigate(location.state?.from || fallback, { replace: true })
  }

  const validate = () => {
    const errors = {}
    if (!form.email.trim()) errors.email = 'Email is required.'
    if (!form.password) errors.password = 'Password is required.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setLoading(true)
    try {
      const data = await login(form.email.trim(), form.password)
      routeAfterAuth(data.user)
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Pick up right where your last study session left off."
      subtitle="Your notes, quizzes, and AI assistant are exactly where you left them."
    >
      <h2 className="font-display text-2xl font-semibold text-ink">Sign in</h2>
      <p className="mt-1.5 text-sm text-ink-muted">Enter your details to access your workspace.</p>

      <div className="mt-7">
        <ErrorBanner message={formError} />

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField
            id="email"
            name="email"
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@university.edu"
            autoComplete="email"
            value={form.email}
            onChange={onChange}
            error={fieldErrors.email}
          />
          <PasswordField
            id="password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={form.password}
            onChange={onChange}
            error={fieldErrors.password}
          />

          <SubmitButton loading={loading}>Sign In</SubmitButton>
        </form>

        <p className="mt-7 text-center text-sm text-ink-muted">
          Don&rsquo;t have an account?{' '}
          <Link to="/signup" className="text-primary-light hover:text-primary font-medium transition-colors">
            Create Account
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
