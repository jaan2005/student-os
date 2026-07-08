import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getAuthErrorMessage } from '../lib/authErrors.js'
import AuthShell from '../components/auth/AuthShell.jsx'
import FormField from '../components/auth/FormField.jsx'
import PasswordField from '../components/auth/PasswordField.jsx'
import ErrorBanner from '../components/auth/ErrorBanner.jsx'
import SubmitButton from '../components/auth/SubmitButton.jsx'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((f) => ({ ...f, [name]: '' }))
  }

  const routeAfterAuth = (user) => {
    navigate(user?.profileCompleted ? '/dashboard' : '/profile-setup', { replace: true })
  }

  const validate = () => {
    const errors = {}
    if (!form.email.trim()) errors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email.'

    if (!form.password) errors.password = 'Password is required.'
    else if (form.password.length < 6) errors.password = 'Use at least 6 characters.'

    if (!form.confirmPassword) errors.confirmPassword = 'Confirm your password.'
    else if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords don\u2019t match.'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setLoading(true)
    try {
      const data = await signup(form.email.trim(), form.password)
      routeAfterAuth(data.user)
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="GET STARTED"
      title="Build the academic workspace you actually want to use."
      subtitle="One account for notes, AI study help, quizzes, and everything else on your way to graduation."
    >
      <h2 className="font-display text-2xl font-semibold text-ink">Create your account</h2>
      <p className="mt-1.5 text-sm text-ink-muted">Free forever. No credit card required.</p>

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
            placeholder="At least 6 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={onChange}
            error={fieldErrors.password}
          />
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={onChange}
            error={fieldErrors.confirmPassword}
          />

          <SubmitButton loading={loading}>Create Account</SubmitButton>
        </form>

        <p className="mt-7 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-light hover:text-primary font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
