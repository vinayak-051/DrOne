import { format, parseISO } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return ''
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'dd MMM yyyy')
  } catch {
    return date
  }
}

export const formatTime = (time) => {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${m} ${ampm}`
}

export const generateOPNumber = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(100000 + Math.random() * 900000)
  return `OP-${year}-${random}`
}

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}
