import { Link } from 'react-router-dom'

export const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''} ${className}`}>
    {children}
  </div>
)

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>{children}</div>
)

export const CardBody = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
)

export const StatCard = ({ icon: Icon, label, value, color = 'blue', trend, to }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  const inner = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  )
  if (to) return (
    <Link to={to}>
      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-200">{inner}</Card>
    </Link>
  )
  return <Card className="p-6">{inner}</Card>
}
