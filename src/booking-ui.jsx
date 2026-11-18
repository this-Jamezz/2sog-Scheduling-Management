import React from 'react'
import { today, daysAhead, availableSlots, formatTime } from './booking'

export function Input({label, name, value, change, ...props}) {
  return <label className="label">{label}<input className="field font-normal" name={name} value={value} onChange={event => change(name,event.target.value)} {...props} /></label>
}

export function Schedule({value, change, data, ignoreId}) {
  const slots = availableSlots(value.date,data.bookings,data.blocked,ignoreId)
  return <div className="grid gap-4">
    <Input label="Appointment date" name="date" value={value.date} change={change} type="date" min={today()} max={daysAhead(today(),60)} required />
    <fieldset>
      <legend className="label">Available times <span className="font-normal text-muted">(Philippine time)</span></legend>
      {value.date && slots.length ? <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{slots.map(time => <label key={time} className="cursor-pointer">
        <input className="peer sr-only" type="radio" name="slot" value={time} checked={value.time === time} onChange={() => change('time',time)} required />
        <span className="block rounded-lg border border-line px-2 py-3 text-center text-sm font-medium peer-checked:border-brand peer-checked:bg-red-50 peer-checked:text-brand peer-focus-visible:outline-2 peer-focus-visible:outline-brand">{formatTime(time)}</span>
      </label>)}</div> : <p className="mt-2 text-sm text-muted">{value.date ? 'No available times on this date. Choose another day.' : 'Pick a date to see times.'}</p>}
    </fieldset>
  </div>
}

const badgeColors = {
  Pending:'bg-amber-50 text-amber-900', Confirmed:'bg-blue-50 text-blue-800', Completed:'bg-emerald-50 text-emerald-800',
  Cancelled:'bg-red-50 text-red-800', 'No-show':'bg-slate-100 text-slate-700'
}
export function Badge({status}) {
  return <span className={'inline-block rounded-full px-3 py-1 text-xs font-semibold '+badgeColors[status]}>{status}</span>
}


