import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BASE_PRICE, INCLUDED_KM, RATE, SHOP, SLOTS, statuses, transitions, money, today, formatDay, formatTime, availableSlots, openBooking } from './booking'
import { Badge, Input, Schedule } from './booking-ui'
import { useBookingData } from './booking-store'
import { formatKm, mapLink } from './visit-route'
import './styles.css'

const sections = ['Overview', 'Appointments', 'Availability', 'Services', 'Customers', 'Feedback', 'Reports', 'Settings']
const descriptions = {
  Overview: 'Monitor bookings and inspection revenue.',
  Appointments: 'Review incoming requests and manage scheduled checkups.',
  Availability: 'Review working hours and block dates on the booking calendar.',
  Services: 'Review the vehicle checkup fee and travel estimate rules.',
  Customers: 'Browse customer records and booking history.',
  Feedback: 'Review ratings and comments from completed checkups.',
  Reports: 'Review monthly appointment totals and income.',
  Settings: 'Review the shop details and booking defaults.',
}
const statusColors = ['bg-amber-500', 'bg-blue-600', 'bg-emerald-700', 'bg-brand', 'bg-slate-500']
const actionLabels = { Confirmed: 'Confirm', Completed: 'Mark completed', Cancelled: 'Cancel', 'No-show': 'Mark no-show' }
const total = booking => BASE_PRICE + booking.fee
const isRevenue = booking => booking.status === 'Completed' && booking.paid

function AdminApp() {
  const [data, update] = useBookingData()
  const [section, setSection] = useState('Overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [month, setMonth] = useState(today().slice(0, 7))
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const monthly = data.bookings.filter(booking => booking.date.startsWith(month))

  function navigate(next, id = null) {
    setSection(next)
    setSelected(id)
    setNotice('')
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }

  function updateBooking(id, patch) {
    update(current => ({ ...current, bookings: current.bookings.map(booking => booking.id === id ? { ...booking, ...patch } : booking) }))
    setNotice('Appointment updated.')
  }

  return <div className="relative min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
    <aside id="admin-navigation" className={(menuOpen ? 'block' : 'hidden') + ' absolute inset-x-0 top-18 z-10 border-b border-line bg-white lg:sticky lg:inset-x-auto lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0'}>
      <div className="hidden px-7 pt-7 pb-10 lg:block"><img src="/2sog-logo.svg" alt="2Sog" width="124" height="34" /></div>
      <p className="px-7 pt-5 pb-3 text-xs font-bold tracking-wider text-muted uppercase lg:pt-0">Workspace</p>
      <nav aria-label="Admin workspace" className="grid grid-cols-2 gap-1 px-4 pb-4 sm:grid-cols-4 lg:grid-cols-1">
        {sections.map(name => <button key={name} type="button" onClick={() => navigate(name)} aria-current={section === name ? 'page' : undefined} className={'relative min-h-11 rounded-lg px-4 text-left text-sm font-semibold transition ' + (section === name ? 'bg-red-50 text-brand before:absolute before:inset-y-2.5 before:left-0 before:w-0.75 before:rounded-r before:bg-brand' : 'hover:bg-paper')}>{name}</button>)}
      </nav>
      <div className="mx-6 mt-auto hidden border-t border-line py-5 text-sm lg:block"><p className="font-semibold">Inspection operations</p><a href="/" className="mt-2 inline-block text-muted hover:text-brand">Customer website <span aria-hidden="true">↗</span></a></div>
    </aside>
    <div className="min-w-0">
      <header className="flex min-h-18 flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-5 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <button type="button" className="button-outline lg:hidden" aria-controls="admin-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>Menu</button>
          <p className="text-sm text-muted">Admin workspace <span aria-hidden="true">/</span> <strong className="font-semibold text-ink">{section}</strong></p>
        </div>
        <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-brand">Demo</span>
      </header>
      <main className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="title !text-3xl sm:!text-[2.65rem]">{section === 'Overview' ? 'Inspection overview' : section === 'Services' ? 'Checkup pricing' : section === 'Settings' ? 'Business settings' : section}</h1><p className="mt-2 text-sm leading-relaxed text-muted">{descriptions[section]} Data is saved in this browser.</p></div>
          {['Overview', 'Reports'].includes(section) && <Input label="Report month" name="month" type="month" value={month} change={(_, value) => setMonth(value || today().slice(0, 7))} />}
        </div>
        {notice && <p role="status" className="mb-4 text-sm font-semibold text-brand">{notice}</p>}
        {section === 'Overview' && <>
          <Metrics bookings={monthly} />
          <div className="my-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]"><RevenueChart bookings={monthly} /><StatusChart bookings={monthly} /></div>
          <AppointmentTable title="Recent bookings" bookings={data.bookings.slice(0, 5)} onSelect={id => navigate('Appointments', id)} action={<button className="text-sm font-semibold text-brand hover:underline" onClick={() => navigate('Appointments')}>View all appointments</button>} />
        </>}
        {section === 'Appointments' && <Appointments data={data} selected={selected} setSelected={setSelected} onChange={updateBooking} />}
        {section === 'Availability' && <Availability data={data} update={update} setNotice={setNotice} />}
        {section === 'Services' && <Services />}
        {section === 'Customers' && <Customers bookings={data.bookings} onSelect={id => navigate('Appointments', id)} />}
        {section === 'Feedback' && <Feedback entries={data.feedback} update={update} />}
        {section === 'Reports' && <><Metrics bookings={monthly} /><div className="my-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]"><RevenueChart bookings={monthly} /><StatusChart bookings={monthly} /></div><AppointmentTable title="Completed and paid" bookings={monthly.filter(isRevenue)} onSelect={id => navigate('Appointments', id)} /></>}
        {section === 'Settings' && <section className="card max-w-3xl p-6"><h2 className="text-xl font-semibold">Business profile</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Info label="Business name">2Sog Vehicle Inspections</Info><Info label="Shop location">{SHOP}</Info><Info label="Time zone">Philippine time (UTC+8)</Info><Info label="Booking mode">At the shop or on-site visit</Info></dl></section>}
      </main>
    </div>
  </div>
}

function Info({ label, children }) {
  return <div className="min-w-0"><dt className="text-xs font-semibold text-muted">{label}</dt><dd className="mt-1 break-words text-sm">{children}</dd></div>
}

function Metrics({ bookings }) {
  const cards = [
    ['Monthly income', money(bookings.filter(isRevenue).reduce((sum, booking) => sum + total(booking), 0)), 'Completed and paid'],
    ['Appointments', bookings.length, 'Scheduled this month'],
    ['Pending', bookings.filter(b => b.status === 'Pending').length, 'Awaiting confirmation'],
    ['Completed', bookings.filter(b => b.status === 'Completed').length, 'Checkups this month'],
  ]
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map(([label, value, help]) => <section className="card min-w-0 p-4" key={label}><h2 className="text-sm text-muted">{label}</h2><p className="mt-1 break-words text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p><p className="mt-1 text-xs text-muted">{help}</p></section>)}</div>
}

function RevenueChart({ bookings }) {
  const totals = [0, 0, 0, 0, 0]
  for (const booking of bookings.filter(isRevenue)) {
    totals[Math.floor((Number(booking.date.slice(-2)) - 1) / 7)] += total(booking)
  }
  const ceiling = Math.max(...totals, 1)
  return <section className="card p-5">
    <h2 className="text-xl font-semibold">Revenue trend</h2><p className="mt-1 text-sm text-muted">Completed and paid checkups by week</p>
    <ul className="mt-5 grid grid-cols-5 gap-2 sm:gap-4">{totals.map((value, i) => <li key={i} className="flex min-w-0 flex-col gap-2 text-center"><div className="flex h-24 items-end justify-center rounded-md bg-paper"><div aria-hidden="true" className="w-1/2 rounded-t bg-brand/75" style={{ height: value / ceiling * 100 + '%' }} /></div><span className="text-xs text-muted">Week {i + 1}</span><span className="break-words text-xs font-semibold">{money(value)}</span></li>)}</ul>
  </section>
}

function StatusChart({ bookings }) {
  return <section className="card p-5"><h2 className="text-xl font-semibold">Appointment status</h2><ul className="mt-5 grid gap-4">
    {statuses.map((status, index) => {
      const count = bookings.filter(b => b.status === status).length
      return <li key={status} className="grid grid-cols-[82px_1fr_30px] items-center gap-2 text-sm"><span className="text-muted">{status}</span><div aria-hidden="true" className="h-2 rounded-full bg-paper"><div className={'h-full rounded-full ' + statusColors[index]} style={{ width: (bookings.length ? count / bookings.length * 100 : 0) + '%' }} /></div><span className="text-right font-semibold">{count}</span></li>
    })}
  </ul></section>
}

function AppointmentTable({ title, bookings, onSelect, action }) {
  return <section className="card min-w-0 overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><h2 className="text-xl font-semibold">{title}</h2>{action}</div>
    <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><caption className="sr-only">{title}</caption><thead className="bg-paper text-xs text-muted"><tr>{['Reference', 'Customer', 'Location', 'Schedule', 'Status', 'Total'].map(label => <th key={label} scope="col" className="px-5 py-3">{label}</th>)}</tr></thead>
      <tbody>{bookings.map(booking => <tr key={booking.id} className="border-t border-line"><td className="px-5 py-3"><button className="font-semibold text-brand hover:underline" onClick={() => onSelect(booking.id)}>{booking.id}</button></td><td className="px-5 py-3"><strong className="font-semibold">{booking.name}</strong></td><td className="px-5 py-3">{booking.mode === 'visit' ? 'On-site visit' : 'Shop'}{booking.mode === 'visit' && <p className="text-xs text-muted">{formatKm(booking.km)}</p>}</td><td className="px-5 py-3">{formatDay(booking.date)}<br /><span className="text-xs text-muted">{formatTime(booking.time)}</span></td><td className="px-5 py-3"><Badge status={booking.status} /></td><td className="px-5 py-3">{money(total(booking))}{booking.mode === 'visit' && <p className="text-xs text-muted">Estimate</p>}</td></tr>)}</tbody>
    </table></div>
    {!bookings.length && <p className="p-5 text-sm text-muted">No matching appointments yet.</p>}
  </section>
}

function Appointments({ data, selected, setSelected, onChange }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const detail = data.bookings.find(booking => booking.id === selected)
  const results = data.bookings.filter(booking => (!status || booking.status === status) && [booking.id, booking.name, booking.email, booking.phone].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
  return <>
    <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_185px]">
      <Input label="Search bookings" name="search" value={query} change={(_, value) => setQuery(value)} placeholder="Reference, customer, email, or phone" />
      <label className="label">Status<select className="field" value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map(label => <option key={label}>{label}</option>)}</select></label>
    </div>
    {detail && <AppointmentDetail key={detail.id} booking={detail} data={data} onClose={() => setSelected(null)} onChange={onChange} />}
    <AppointmentTable title="All appointments" bookings={results} onSelect={setSelected} />
  </>
}

function AppointmentDetail({ booking, data, onClose, onChange }) {
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const visit = booking.mode === 'visit'
  function reschedule(event) {
    event.preventDefault()
    if (!availableSlots(draft.date, data.bookings, data.blocked, booking.id).includes(draft.time)) {
      setError('Choose an available appointment time.')
      return
    }
    onChange(booking.id, draft)
    setDraft(null)
  }
  return <section className="mb-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
    <div className="card p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Appointment {booking.id}</h2><Badge status={booking.status} /></div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2"><Info label="Schedule">{formatDay(booking.date)} · {formatTime(booking.time)}</Info><Info label="Customer">{booking.name}<br />{booking.email}<br />{booking.phone}</Info><Info label={booking.point ? 'Visit location' : visit ? 'Visit address' : 'Shop location'}>{booking.address}{booking.point && <><br /><a className="font-semibold text-brand underline" href={mapLink(booking.point)} target="_blank" rel="noreferrer">Open visit pin on map</a></>}{visit && <><br />{formatKm(booking.km)} from the shop</>}</Info>{booking.notes && <Info label="Notes">{booking.notes}</Info>}</dl>
      {draft && <form onSubmit={reschedule} className="mt-5 grid gap-4 border-t border-line pt-4"><Schedule value={draft} data={data} ignoreId={booking.id} change={(name, value) => { setError(''); setDraft(old => ({ ...old, [name]: value, ...(name === 'date' ? { time: '' } : {}) })) }} />{error && <p role="alert" className="text-sm text-brand">{error}</p>}<div className="flex gap-2"><button className="button" disabled={!draft.time}>Save new time</button><button type="button" className="button-outline" onClick={() => setDraft(null)}>Close reschedule</button></div></form>}
    </div>
    <div className="card p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Status and payment</h2><button onClick={onClose} className="text-sm font-semibold text-brand hover:underline">Close details</button></div>
      <dl className="mt-4 grid grid-cols-2 gap-3"><Info label="Vehicle checkup">{money(BASE_PRICE)}</Info><Info label={visit ? 'Travel estimate' : 'Travel fee'}>{money(booking.fee)}</Info><Info label={visit ? 'Estimated total' : 'Total'}>{money(total(booking))}</Info><Info label="Payment status">{booking.paid ? 'Paid' : 'Unpaid'}</Info></dl>
      <div className="mt-5 flex flex-wrap gap-2">{transitions[booking.status].map(option => <button key={option} onClick={() => { if (option !== 'Cancelled' || window.confirm('Cancel appointment ' + booking.id + '?')) { if (!['Pending','Confirmed'].includes(option)) setDraft(null); onChange(booking.id, { status: option }) } }} className={option === 'Confirmed' ? 'button' : 'button-outline'}>{actionLabels[option]}</button>)}
        {openBooking(booking) && <button className="button-outline" onClick={() => setDraft({ date: booking.date, time: booking.time })}>Reschedule</button>}
        {booking.status === 'Completed' && <button className="button-outline" onClick={() => onChange(booking.id, { paid: !booking.paid })}>{booking.paid ? 'Mark unpaid' : 'Mark paid'}</button>}
      </div>
    </div>
  </section>
}

function Availability({ data, update, setNotice }) {
  const [date, setDate] = useState('')
  function blockDate(event) {
    event.preventDefault()
    if (data.bookings.some(b => b.date === date && openBooking(b))) {
      setNotice('Reschedule or cancel the existing appointments before blocking this date.')
      return
    }
    if (data.blocked.includes(date)) {
      setNotice('This date is already blocked.')
      return
    }
    update(current => ({ ...current, blocked: [...new Set([...current.blocked, date])].sort() }))
    setDate('')
    setNotice('Date blocked.')
  }
  return <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
    <section className="card p-6"><h2 className="text-xl font-semibold">Business hours</h2><p className="mt-1 text-sm text-muted">Philippine time (UTC+8)</p><dl className="mt-4">{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => <div className="flex justify-between gap-3 border-t border-line py-3 text-sm" key={day}><dt className="font-semibold">{day}</dt><dd className="text-muted">{day === 'Sunday' ? 'Closed' : formatTime(SLOTS[0]) + ' – ' + formatTime(SLOTS.at(-1)) + ' slots'}</dd></div>)}</dl></section>
    <section className="card p-6"><h2 className="text-xl font-semibold">Blocked dates</h2><p className="mt-1 text-sm text-muted">Blocking a date removes every slot from customer booking.</p>
      <form className="my-5 flex flex-wrap items-end gap-3" onSubmit={blockDate}><Input label="Date to block" name="blockedDate" value={date} change={(_, value) => setDate(value)} type="date" min={today()} required /><button className="button">Block date</button></form>
      {data.blocked.length ? <ul className="grid gap-2">{data.blocked.map(day => <li className="flex items-center justify-between gap-2 border-t border-line pt-2 text-sm" key={day}>{formatDay(day)} · {day}<button className="button-outline" onClick={() => { update(current => ({ ...current, blocked: current.blocked.filter(item => item !== day) })); setNotice('Date reopened.') }}>Reopen</button></li>)}</ul> : <p className="text-sm text-muted">No dates blocked.</p>}
    </section>
  </div>
}

function Services() {
  return <section className="card max-w-3xl p-6"><h2 className="text-xl font-semibold">Vehicle checkup</h2>
    <dl className="mt-5 grid gap-5 sm:grid-cols-2"><Info label="Base checkup fee">{money(BASE_PRICE)}</Info><Info label="Shop location">{SHOP}</Info><Info label="At the shop">{money(BASE_PRICE)} total</Info><Info label="On-site visit">Base fee plus distance-based travel estimate</Info></dl>
    <p className="mt-5 border-t border-line pt-4 text-sm text-muted">Demo travel rate: the first {INCLUDED_KM} km are included, then {money(RATE)} per additional kilometer. Travel estimates use the driving route from the shop to the selected map pin.</p>
  </section>
}

function Customers({ bookings, onSelect }) {
  const customers = new Map()
  for (const booking of bookings) {
    const email = booking.email.trim().toLowerCase()
    if (!customers.has(email)) customers.set(email, [])
    customers.get(email).push(booking)
  }
  return <section className="card p-6"><h2 className="text-xl font-semibold">Customer records</h2>
    {!customers.size && <p className="mt-4 text-sm text-muted">Customer records appear after the first booking.</p>}
    <ul>{Array.from(customers, ([email, history]) => <li className="mt-4 border-t border-line pt-4" key={email}><h3 className="font-semibold">{history[0].name}</h3><p className="break-words text-sm text-muted">{email} · {history[0].phone}</p><ul className="mt-2 grid gap-1">{history.map(booking => <li key={booking.id}><button className="text-left text-sm font-semibold text-brand hover:underline" onClick={() => onSelect(booking.id)}>{booking.id} · {formatDay(booking.date)}</button></li>)}</ul></li>)}</ul>
  </section>
}

function Feedback({ entries, update }) {
  const [rating, setRating] = useState('')
  const results = entries.filter(entry => !rating || entry.score === Number(rating))
  return <div className="grid gap-4"><label className="label w-fit">Rating<select className="field" value={rating} onChange={event => setRating(event.target.value)}><option value="">All ratings</option>{[5,4,3,2,1].map(score => <option key={score} value={score}>{score} / 5</option>)}</select></label>
    {!results.length && <p className="card p-5 text-sm text-muted">No matching customer feedback.</p>}
    {results.map(item => <article key={item.id} className="card p-5"><h2 className="font-semibold">{item.name} · {item.score}/5</h2><p className="mt-2 break-words text-sm text-muted">{item.comment}</p><button className="button-outline mt-4" onClick={() => update(current => ({ ...current, feedback: current.feedback.map(entry => entry.id === item.id ? { ...entry, reviewed: !entry.reviewed } : entry) }))}>{item.reviewed ? 'Mark unreviewed' : 'Mark reviewed'}</button></article>)}
  </div>
}

createRoot(document.getElementById('root')).render(<AdminApp />)

