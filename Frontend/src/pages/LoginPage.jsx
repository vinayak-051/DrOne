import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'

export const LoginPage = () => {
  const [view, setView] = useState('login') // 'login' | 'forgot' | 'resend'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithPhone } = useAuth()

  const isPhone = /^\d{10}$/.test(identifier.trim())
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())

  const handleLogin = async (e) => {
    e.preventDefault()
    const val = identifier.trim()
    if (!isPhone && !isEmail) {
      toast.error('Enter a valid email or 10-digit phone number')
      return
    }
    setLoading(true)
    try {
      if (isPhone) {
        await signInWithPhone({ phone: val, password })
      } else {
        await signIn({ email: val, password })
      }
      toast.success('Signed in successfully')
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no account')) {
        toast.error('Account not found')
      } else {
        toast.error(msg || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!emailInput.trim()) return toast.error('Enter your email')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailInput.trim(), {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (error) throw error
      toast.success('Password reset email sent! Check your inbox.')
      setView('login')
      setEmailInput('')
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async (e) => {
    e.preventDefault()
    if (!emailInput.trim()) return toast.error('Enter your email')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: emailInput.trim() })
      if (error) throw error
      toast.success('Verification email sent! Check your inbox.')
      setView('login')
      setEmailInput('')
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification email')
    } finally {
      setLoading(false)
    }
  }

  const leftPanel = (
    <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-blue-600 text-white p-12">
      <div className="ring-4 ring-blue-300 rounded-full p-2 mb-8 bg-white">
        <img src={logo} alt="DrOne" className="w-20 h-20 object-contain rounded-full" />
      </div>
      <h2 className="text-4xl font-bold mb-4">DrOne</h2>
      <p className="text-blue-200 text-xl text-center max-w-sm">Your complete hospital at home</p>
      <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
        {['Easy Booking', 'Digital Records'].map((f) => (
          <div key={f} className="bg-white/10 rounded-xl p-4 text-sm font-medium">{f}</div>
        ))}
      </div>
    </div>
  )

  if (view === 'forgot') {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
        {leftPanel}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <button onClick={() => { setView('login'); setEmailInput('') }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h2>
              <p className="text-gray-500 text-sm mb-8">Enter your registered email and we&apos;ll send a reset link.</p>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <Input label="Email" type="email" placeholder="Enter your email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required />
                <Button type="submit" loading={loading} className="w-full" size="lg">Send Reset Link</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'resend') {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
        {leftPanel}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <button onClick={() => { setView('login'); setEmailInput('') }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Resend Verification</h2>
              <p className="text-gray-500 text-sm mb-8">Enter your email to resend the account verification link.</p>
              <form onSubmit={handleResendVerification} className="space-y-5">
                <Input label="Email" type="email" placeholder="Enter your email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required />
                <Button type="submit" loading={loading} className="w-full" size="lg">Resend Verification Email</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
      {leftPanel}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <img src={logo} alt="DrOne" className="w-10 h-10 object-contain" />
              <h1 className="text-2xl font-bold text-gray-900">DrOne</h1>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-8">Sign in to your account</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email or Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter email or 10-digit phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {identifier.length > 0 && !isPhone && !isEmail && (
                  <p className="text-xs text-gray-400 mt-1">Enter a valid email or 10-digit phone number</p>
                )}
              </div>

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setView('forgot')} className="text-xs text-blue-600 hover:underline">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign In
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button type="button" onClick={() => setView('resend')} className="text-xs text-gray-400 hover:text-gray-600 hover:underline">
                Didn&apos;t receive verification email?
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-blue-600 font-medium hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
