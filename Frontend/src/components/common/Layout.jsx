import { useState, useRef, useEffect } from 'react'
import { Menu, X, Bell } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import logo from '../../assets/logo.png'

const TYPE_COLORS = {
  appointment: 'bg-blue-50 border-blue-100',
  patient: 'bg-green-50 border-green-100',
  medical: 'bg-purple-50 border-purple-100',
  info: 'bg-gray-50 border-gray-100',
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const NotificationPanel = ({ items, clear, onClose }) => (
  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
      <span className="font-semibold text-gray-900 text-sm">Notifications</span>
      {items.length > 0 && (
        <button
          onClick={() => { clear(); onClose() }}
          className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
      {items.length === 0 ? (
        <div className="py-12 text-center">
          <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No notifications</p>
        </div>
      ) : (
        items.map(n => (
          <div key={n.id} className={`px-4 py-3 border-l-2 ${TYPE_COLORS[n.type] || TYPE_COLORS.info} ${!n.read ? 'border-l-blue-400' : 'border-l-transparent'}`}>
            <p className="text-sm font-medium text-gray-900 leading-snug">{n.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
            <p className="text-xs text-gray-400 mt-1">{timeAgo(n.at)}</p>
          </div>
        ))
      )}
    </div>
  </div>
)

export const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)
  const { profile } = useAuth()
  const role = profile?.role
  const { items, unread, markRead, clear } = useNotifications(role)

  // Close bell panel on outside click
  useEffect(() => {
    if (!bellOpen) return
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [bellOpen])

  const openBell = () => {
    setBellOpen(v => !v)
    if (!bellOpen) markRead()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 shadow-xl">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
          <button
            className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          {/* Hamburger — mobile only */}
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo — mobile only */}
          <div className="flex items-center gap-2 lg:hidden">
            <img src={logo} alt="DrOne" className="w-7 h-7 object-contain" />
            <span className="font-bold text-gray-900">DrOne</span>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden lg:flex flex-1" />

          {/* Notification bell — all screens */}
          <div ref={bellRef} className="relative">
            <button
              onClick={openBell}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <NotificationPanel items={items} clear={clear} onClose={() => setBellOpen(false)} />
            )}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
