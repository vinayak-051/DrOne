import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/common/Button'
import { Input, Select } from '../components/common/Input'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'

export const RegisterPage = () => {
  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '', age: '', gender: 'male',
  })
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await signUp(form)
      toast.success('Account created! Please check your email to verify.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <img src={logo} alt="DrOne" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-bold text-gray-900">DrOne</h1>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Create your account</h2>
          <p className="text-gray-500 text-sm mb-6">Register as a patient</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" placeholder="John Doe" value={form.name} onChange={set('name')} required />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Age" type="number" min="1" max="120" placeholder="25" value={form.age} onChange={set('age')} required />
              <Select label="Gender" value={form.gender} onChange={set('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <Input label="Phone Number" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={set('phone')} required />
            <Input label="Email" type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} required />
            <Input label="Password" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
