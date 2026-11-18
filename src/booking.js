export const SHOP = 'Marikina Heights, Marikina City'
export const BASE_PRICE = 2500
export const INCLUDED_KM = 5
export const RATE = 30
export const SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00']
export const statuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-show']
export const transitions = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Completed', 'Cancelled', 'No-show'],
  Completed: [],
  Cancelled: [],
  'No-show': [],
}

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' })
export const today = () => dayFormat.format(new Date())
export function daysAhead(start, offset) {
  const day = new Date(start + 'T12:00:00+08:00')
  day.setUTCDate(day.getUTCDate() + offset)
  return dayFormat.format(day)
}
export const money = value => '₱' + value.toLocaleString('en-PH', { maximumFractionDigits: 2 })
export const formatDay = value => new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(value + 'T12:00:00+08:00'))
export const formatTime = value => new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }).format(new Date('2026-01-01T' + value + ':00+08:00'))
export const travelFee = (mode, km) => mode === 'visit' ? Math.round(Math.max(0, Number(km) - INCLUDED_KM) * RATE * 100) / 100 : 0
export const openBooking = booking => ['Pending', 'Confirmed'].includes(booking.status)
export function availableSlots(date, bookings, blocked, ignoreId) {
  if (!date || date < today() || blocked.includes(date) || new Date(date + 'T12:00:00Z').getUTCDay() === 0) return []
  return SLOTS.filter(time => {
    if (new Date(date + 'T' + time + ':00+08:00').getTime() <= Date.now()) return false
    return !bookings.some(b => (!ignoreId || b.id !== ignoreId) && b.date === date && b.time === time && b.status !== 'Cancelled' && b.status !== 'No-show')
  })
}

export const initial = { bookings: [], blocked: [], feedback: [] }
export const blankBooking = () => ({
  mode: 'shop', date: '', time: '', name: '', email: '', phone: '', notes: '',
})
