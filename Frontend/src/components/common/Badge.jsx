export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export const statusBadge = (status) => {
  const map = {
    confirmed: { variant: 'success', label: 'Confirmed' },
    pending: { variant: 'warning', label: 'Pending' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
    completed: { variant: 'info', label: 'Completed' },
    paid: { variant: 'success', label: 'Paid' },
    waiting: { variant: 'warning', label: 'Waiting' },
    in_progress: { variant: 'info', label: 'In Progress' },
  }
  return map[status] || { variant: 'default', label: status }
}
