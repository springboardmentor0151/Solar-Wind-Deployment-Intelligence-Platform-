import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'
import { loginUser, googleLogin, resetPassword } from '../Authentication/authService.js'

export default function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const next = {}
    if (!form.email.trim()) {
      next.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address.'
    }
    if (!form.password) next.password = 'Password is required.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setInfoMessage('')
    if (!validate()) return

    setLoading(true)
    try {
      await loginUser(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setFormError(mapAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setFormError('')
    setInfoMessage('')
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

  const handleForgotPassword = async () => {
    setFormError('')
    setInfoMessage('')

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrors((prev) => ({ ...prev, email: 'Enter your email above first, then click "Forgot Password".' }))
      return
    }

    setResetLoading(true)
    try {
      await resetPassword(form.email)
      setInfoMessage('Password reset email sent — check your inbox.')
    } catch (err) {
      setFormError(mapAuthError(err))
    } finally {
      setResetLoading(false)
    }
  }

  const busy = loading || googleLoading || resetLoading

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-navy overflow-hidden px-6 py-16">
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
          <h1 className="text-2xl font-extrabold text-white text-center">Welcome back</h1>
          <p className="mt-2 text-sm text-white/50 text-center">Log in to continue to your dashboard.</p>

          {formError && (
            <p className="mt-5 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {formError}
            </p>
          )}
          {infoMessage && (
            <p className="mt-5 text-sm text-green bg-green/10 border border-green/20 rounded-xl px-4 py-2.5">
              {infoMessage}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-white/70">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-sm text-green font-medium hover:underline disabled:opacity-60"
                >
                  {resetLoading ? 'Sending…' : 'Forgot password?'}
                </button>
              </div>
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

            <label className="flex items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-green focus:ring-green/30"
              />
              Remember me
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-green text-navy font-bold py-3 rounded-xl transition-all duration-300 hover:shadow-glow hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading && <Spinner />}
              {loading ? 'Logging in…' : 'Login'}
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
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-green font-semibold hover:underline">
                Register
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
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

function mapAuthError(err) {
  const code = err?.code || ''
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Incorrect email or password.'
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again later.'
  if (code.includes('popup-closed-by-user')) return 'Google sign-in was cancelled.'
  return err?.message || 'Something went wrong. Please try again.'
}
