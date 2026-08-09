import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi'
import { registerUser, googleLogin } from '../Authentication/authService.js'

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'analyst',
    agree: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Full name is required.'
    if (!form.email.trim()) {
      next.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address.'
    }
    if (!form.password) {
      next.password = 'Password is required.'
    } else if (form.password.length < 6) {
      next.password = 'Password must be at least 6 characters.'
    }
    if (!form.confirmPassword) {
      next.confirmPassword = 'Please confirm your password.'
    } else if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.'
    }
    if (!['analyst', 'viewer'].includes(form.role)) next.role = 'Select a valid role.'
    if (!form.agree) next.agree = 'You must agree to the Terms to continue.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setLoading(true)
    try {
      await registerUser(form.name, form.email, form.password, form.role)
      navigate('/dashboard')
    } catch (err) {
      setFormError(mapAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setFormError('')
    setGoogleLoading(true)
    try {
      await googleLogin()
      navigate('/dashboard')
    } catch (err) {
      setFormError(mapAuthError(err))
    } finally {
      setGoogleLoading(false)
    }
  }

  const busy = loading || googleLoading

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-navy overflow-hidden px-6 py-16">
      {/* Ambient gradient blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue/25 rounded-full blur-3xl animate-blob" />
      <div
        className="absolute -bottom-24 -right-20 w-[28rem] h-[28rem] bg-green/20 rounded-full blur-3xl animate-blob"
        style={{ animationDelay: '3s' }}
      />

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 font-bold text-lg text-white mb-8">
          <span className="text-2xl">⚡</span>
          <span>
            Solar & Wind <span className="text-green">AI</span>
          </span>
        </Link>

        <div className="glass-dark rounded-3xl shadow-2xl px-8 py-9">
          <h1 className="text-2xl font-extrabold text-white text-center">Create your account</h1>
          <p className="mt-2 text-sm text-white/50 text-center">
            Start analyzing renewable energy sites with AI.
          </p>

          {formError && (
            <p className="mt-5 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {formError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="text-sm font-medium text-white/70 mb-1.5 block">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 text-lg" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 outline-none transition-all focus:ring-2 ${
                    errors.name
                      ? 'border-red-400/60 focus:ring-red-400/20'
                      : 'border-white/10 focus:border-green focus:ring-green/20'
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs text-red-300">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 mb-1.5 block">Email</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 text-lg" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 outline-none transition-all focus:ring-2 ${
                    errors.email
                      ? 'border-red-400/60 focus:ring-red-400/20'
                      : 'border-white/10 focus:border-green focus:ring-green/20'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-300">{errors.email}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 mb-1.5 block">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 text-lg" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-11 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 outline-none transition-all focus:ring-2 ${
                    errors.password
                      ? 'border-red-400/60 focus:ring-red-400/20'
                      : 'border-white/10 focus:border-green focus:ring-green/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-300">{errors.password}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 text-lg" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 outline-none transition-all focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-red-400/60 focus:ring-red-400/20'
                      : 'border-white/10 focus:border-green focus:ring-green/20'
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-300">{errors.confirmPassword}</p>
              )}
            </div>


            <div>
              <label className="text-sm font-medium text-white/70 mb-1.5 block">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl bg-navy border text-white outline-none transition-all focus:ring-2 ${
                  errors.role
                    ? 'border-red-400/60 focus:ring-red-400/20'
                    : 'border-white/10 focus:border-green focus:ring-green/20'
                }`}
              >
                <option value="analyst">Analyst</option>
                <option value="viewer">Viewer</option>
              </select>
              {errors.role && <p className="mt-1.5 text-xs text-red-300">{errors.role}</p>}
              <p className="mt-1.5 text-xs text-white/40">
                Admin access is assigned separately by an administrator.
              </p>
            </div>

            <div>
              <label className="flex items-start gap-2.5 text-sm text-white/60">
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-green focus:ring-green/30"
                />
                <span>
                  I agree to the{' '}
                  <a href="#" className="text-green font-medium hover:underline">
                    Terms
                  </a>
                </span>
              </label>
              {errors.agree && <p className="mt-1.5 text-xs text-red-300">{errors.agree}</p>}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-green text-navy font-bold py-3 rounded-xl transition-all duration-300 hover:shadow-glow hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading && <Spinner />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <div className="flex items-center gap-3 text-xs text-white/30">
              <div className="flex-1 h-px bg-white/10" />
              OR
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 font-semibold text-white py-3 rounded-xl transition-all duration-300 hover:bg-white/10 disabled:opacity-60"
            >
              {googleLoading ? <Spinner light /> : <FcGoogle className="text-xl" />}
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </button>

            <p className="text-center text-sm text-white/50">
              Already have an account?{' '}
              <Link to="/login" className="text-green font-semibold hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

function Spinner({ light }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${light ? 'text-navy' : 'text-navy'}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

function mapAuthError(err) {
  const code = err?.code || ''
  if (code.includes('email-already-in-use')) return 'An account with this email already exists.'
  if (code.includes('weak-password')) return 'Password is too weak.'
  if (code.includes('invalid-email')) return 'Please enter a valid email address.'
  if (code.includes('popup-closed-by-user')) return 'Google sign-in was cancelled.'
  return err?.message || 'Something went wrong. Please try again.'
}
