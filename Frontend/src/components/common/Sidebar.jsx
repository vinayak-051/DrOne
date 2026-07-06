import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, FileText, Users, Search,
  BarChart2, Clock, Activity, LogOut, Stethoscope, CalendarOff, FolderOpen,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import logo from '../../assets/logo.png'

const patientNav = [
  { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patient/book', icon: Calendar, label: 'Book Appointment' },
  { to: '/patient/appointments', icon: Clock, label: 'My Appointments' },
  { to: '/patient/history', icon: FileText, label: 'Medical History' },
  { to: '/patient/reports', icon: FolderOpen, label: 'My Reports' },
  { to: '/patient/doctor', icon: Stethoscope, label: 'Know Your Doctor' },
]



const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/admin/queue', icon: Clock, label: 'Queue System' },
  { to: '/admin/patients', icon: Users, label: 'Patients' },
  { to: '/admin/search', icon: Search, label: 'Search' },
  { to: '/admin/records', icon: FileText, label: 'Medical Records' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/admin/leaves', icon: CalendarOff, label: 'Leaves' },
]

export const Sidebar = ({ mobile = false, onClose }) => {
  const { isAdmin, signOut, profile, patient } = useAuth()
  const navigate = useNavigate()
  const navItems = isAdmin ? adminNav : patientNav

  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async () => {
      const { data } = await supabase.from('doctor_profiles').select('*').limit(1).single()
      return data
    },
    enabled: isAdmin,
  })

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${mobile ? 'w-full' : 'w-64'}`}>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <img src={logo} alt="DrOne" className="w-9 h-9 object-contain" />
        <div>
          <h1 className="font-bold text-gray-900 text-lg leading-tight">DrOne</h1>
          <p className="text-xs text-gray-400">{isAdmin ? 'Admin Portal' : 'Patient Portal'}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        {isAdmin ? (
          <button
            onClick={() => { navigate('/admin/profile'); onClose?.() }}
            className="flex items-center gap-3 px-3 py-2 mb-2 w-full rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{doctorProfile?.name || profile?.email || 'Doctor'}</p>
              <p className="text-xs text-gray-400">View Profile</p>
            </div>
          </button>
        ) : (
          <button
            onClick={() => { navigate('/patient/profile'); onClose?.() }}
            className="flex items-center gap-3 px-3 py-2 mb-2 w-full rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{patient?.name || profile?.email}</p>
              <p className="text-xs text-gray-400">View Profile</p>
            </div>
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
