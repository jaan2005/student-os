import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, GraduationCap, Building2, CalendarDays } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getAuthErrorMessage } from '../lib/authErrors.js'
import FormField from '../components/auth/FormField.jsx'
import ErrorBanner from '../components/auth/ErrorBanner.jsx'
import SubmitButton from '../components/auth/SubmitButton.jsx'

const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8']

export default function ProfileSetup() {
  const { user, saveProfile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    college: user?.college || '',
    branch: user?.branch || '',
    semester: user?.semester || '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((f) => ({ ...f, [name]: '' }))
  }

  const validate = () => {
    const errors = {}
    ;['firstName', 'lastName', 'college', 'branch', 'semester'].forEach((field) => {
      if (!form[field].trim()) errors[field] = 'This field is required.'
    })
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setLoading(true)
    try {
      await saveProfile(form)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-base flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_25%,transparent_80%)]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/15 blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-xl"
      >
        <div className="text-center mb-8">
          <p className="eyebrow text-xs text-primary-light mb-3">ONE LAST STEP</p>
          <h1 className="font-display text-3xl sm:text-[2.2rem] font-semibold tracking-tight text-ink">
            Tell us about your studies
          </h1>
          <p className="mt-3 text-ink-muted text-sm max-w-md mx-auto">
            This helps Student OS organize your notes, quizzes, and resources around your actual
            program.
          </p>
        </div>

        <div className="rounded-2xl glass shadow-glow-lg p-8 sm:p-9">
          <ErrorBanner message={formError} />

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                id="firstName"
                name="firstName"
                label="First Name"
                icon={User}
                placeholder="Aria"
                autoComplete="given-name"
                value={form.firstName}
                onChange={onChange}
                error={fieldErrors.firstName}
              />
              <FormField
                id="lastName"
                name="lastName"
                label="Last Name"
                icon={User}
                placeholder="Patel"
                autoComplete="family-name"
                value={form.lastName}
                onChange={onChange}
                error={fieldErrors.lastName}
              />
            </div>

            <FormField
              id="college"
              name="college"
              label="College"
              icon={Building2}
              placeholder="e.g. Delhi University"
              autoComplete="organization"
              value={form.college}
              onChange={onChange}
              error={fieldErrors.college}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                id="branch"
                name="branch"
                label="Branch"
                icon={GraduationCap}
                placeholder="e.g. Computer Science"
                value={form.branch}
                onChange={onChange}
                error={fieldErrors.branch}
              />

              <div>
                <label htmlFor="semester" className="block text-xs font-medium text-ink-muted mb-1.5">
                  Semester
                </label>
                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
                  />
                  <select
                    id="semester"
                    name="semester"
                    value={form.semester}
                    onChange={onChange}
                    aria-invalid={Boolean(fieldErrors.semester)}
                    className={`w-full appearance-none rounded-lg bg-white/[0.03] border ${
                      fieldErrors.semester ? 'border-red-500/50' : 'border-white/10'
                    } pl-10 pr-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary/60 focus:bg-white/[0.05] transition-colors`}
                  >
                    <option value="" disabled className="bg-base-card">
                      Select semester
                    </option>
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s} className="bg-base-card">
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.semester && (
                  <p className="mt-1.5 text-xs text-red-400">{fieldErrors.semester}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton loading={loading}>Save and Continue</SubmitButton>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
