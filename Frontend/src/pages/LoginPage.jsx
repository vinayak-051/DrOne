import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'

export const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(form)
      toast.success('Welcome back!')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-blue-600 text-white p-12">
        <div className="ring-4 ring-blue-300 rounded-full p-2 mb-8 bg-white">
          <img src={logo} alt="DrOne" className="w-20 h-20 object-contain rounded-full" />
        </div>
        <h2 className="text-4xl font-bold mb-4">DrOne</h2>
        <p className="text-blue-200 text-xl text-center max-w-sm">
          Your complete hospital at home
        </p>
        <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
          {['Easy Booking', 'Digital Records'].map((f) => (
            <div key={f} className="bg-white/10 rounded-xl p-4 text-sm font-medium">{f}</div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <img src={logo} alt="DrOne" className="w-10 h-10 object-contain" />
              <h1 className="text-2xl font-bold text-gray-900">DrOne</h1>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-8">Sign in to your account</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
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
