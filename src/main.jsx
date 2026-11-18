import React, { lazy, Suspense, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { SHOP, BASE_PRICE, INCLUDED_KM, RATE, blankBooking, travelFee, money, formatDay, formatTime, availableSlots, openBooking } from './booking'
import { Input, Schedule, Badge } from './booking-ui'
import { useBookingData } from './booking-store'
import { formatKm, mapLink, pinText } from './visit-route'
import './styles.css'

const VisitMap = lazy(() => import('./visit-map'))

const paths = { home: 'Home', book: 'Book a checkup', bookings: 'My bookings' }
const route = () => Object.keys(paths).includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home'
function App() {
  const [page, setPage] = useState(route)
  const [data, update] = useBookingData()
  useEffect(() => {
    const navigate = () => { setPage(route()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  return <>
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="wrap flex min-h-18 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
        <a href="#home" aria-label="2Sog home"><img src="/2sog-logo.svg" alt="2Sog" width="115" height="32" /></a>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-4 text-sm font-semibold sm:gap-7">
          {Object.entries(paths).map(([id, name]) => <a key={id} href={'#'+id} aria-current={page === id ? 'page' : undefined} className={page === id ? 'text-brand' : 'text-ink hover:text-brand'}>{name}</a>)}
        </nav>
      </div>
    </header>
    <main id="main">
      {page === 'home' && <Home />}
      {page === 'book' && <Booking data={data} update={update} />}
      {page === 'bookings' && <MyBookings data={data} update={update} />}
    </main>
    <Footer />
  </>
}

function Footer() {
  return <footer className="border-t border-line bg-white">
    <div className="wrap py-8">
      <div className="flex flex-wrap justify-between gap-6 pb-6">
        <div><a href="#home" aria-label="2Sog home"><img src="/2sog-logo.svg" alt="2Sog" width="108" height="30" /></a><p className="mt-2 text-sm text-muted">{SHOP}</p></div>
        <nav aria-label="Footer" className="flex flex-wrap gap-5 text-sm font-semibold"><a href="#book">Book a checkup</a><a href="#bookings">My bookings</a></nav>
      </div>
      <p className="border-t border-line pt-5 text-sm text-muted">Designed by James Ian Antonio</p>
    </div>
  </footer>
}

function Home() {
  return <>
    <section className="wrap grid items-center gap-10 py-12 lg:grid-cols-[1fr_1.05fr] lg:py-20">
      <div>
        <p className="eyebrow">Vehicle inspections · Marikina</p>
        <h1 className="mt-5 max-w-xl text-[clamp(2.7rem,6vw,5.1rem)] leading-[1.02] font-semibold tracking-[-.065em]">Know your car.<br />Drive with confidence.</h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">Book a vehicle checkup at our shop or request a visit at your location. Every checkup starts at ₱2,500.</p>
        <div className="mt-8 flex flex-wrap gap-3"><a className="button" href="#book">Book a checkup <span aria-hidden="true">→</span></a><a className="button-outline" href="#bookings">My bookings</a></div>
      </div>
      <div className="relative overflow-hidden rounded-3xl bg-ink">
        <img className="aspect-[4/3] w-full object-cover" src="/shop-vehicle.png" alt="A red Honda at the 2Sog shop" fetchPriority="high" />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-6 pt-12 pb-5 text-sm font-semibold text-white">{SHOP}</div>
      </div>
    </section>
    <section className="wrap pb-16">
      <div className="card grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
        <div><h2 className="text-2xl font-semibold tracking-tight">One vehicle checkup</h2><p className="mt-2 max-w-xl text-muted">The shop checkup is ₱2,500. For an on-site visit, the travel estimate depends on road distance from Marikina Heights.</p></div>
        <div><p className="text-sm text-muted">Base checkup fee</p><p className="text-4xl font-semibold tracking-tight">{money(BASE_PRICE)}</p></div>
      </div>
    </section>
    <section className="border-y border-line bg-white">
      <div className="wrap grid items-center gap-8 py-12 sm:grid-cols-2">
        <img className="aspect-[8/7] w-full max-w-lg rounded-2xl object-cover object-[center_58%]" src="/shop-team.png" alt="Two people standing in front of a red car at the 2Sog shop" loading="lazy" />
        <div><h2 className="title">The 2Sog shop</h2><p className="mt-4 text-lg text-muted">{SHOP}</p><div className="mt-7 grid gap-4">
          <details className="border-b border-line pb-3"><summary className="cursor-pointer font-semibold">Where can my checkup take place?</summary><p className="mt-2 text-muted">Visit the Marikina Heights shop or request a checkup at your address.</p></details>
          <details className="border-b border-line pb-3"><summary className="cursor-pointer font-semibold">How is travel priced?</summary><p className="mt-2 text-muted">Pin your visit location to calculate road distance from the shop. The first {INCLUDED_KM} km are included, then {money(RATE)} per extra kilometer. Confirm actual travel pricing with 2Sog.</p></details>
        </div></div>
      </div>
    </section>
  </>
}

function Price({mode, km}) {
  const fee = travelFee(mode,km)
  return <aside className="card h-fit p-6">
    <h2 className="text-xl font-semibold">Price summary</h2>
    <dl className="mt-5 grid gap-3 text-sm">
      <div className="flex justify-between"><dt>Vehicle checkup</dt><dd>{money(BASE_PRICE)}</dd></div>
      {mode === 'visit' && <div className="flex justify-between"><dt>Estimated travel fee</dt><dd>{km === null ? 'Select a pin' : money(fee)}</dd></div>}
      <div className="mt-2 flex items-center justify-between border-t border-line pt-4 font-semibold"><dt>{mode === 'shop' ? 'Total' : 'Estimated total'}</dt><dd className="text-2xl text-brand">{mode === 'visit' && km === null ? '—' : money(BASE_PRICE + fee)}</dd></div>
    </dl>
    {mode === 'visit' && <p className="mt-4 text-xs leading-relaxed text-muted">Demo rate. First {INCLUDED_KM} km included, then {money(RATE)} per extra km. The estimate uses driving distance from the shop.</p>}
  </aside>
}

function Booking({data,update}) {
  const [draft,setDraft] = useState(blankBooking)
  const [quote,setQuote] = useState(null)
  const [visitAddress,setVisitAddress] = useState('')
  const [step,setStep] = useState(0)
  const [error,setError] = useState('')
  const [created,setCreated] = useState(null)
  const change = (name,value) => {
    setError('')
    setDraft(old => ({...old,[name]:value,...(name === 'date' ? {time:''} : {})}))
  }
  const advance = event => {
    event.preventDefault()
    setError('')
    if ((step === 0 || step === 2) && draft.mode === 'visit' && !quote) {
      setError('Pin your location and calculate the travel estimate.')
      setStep(0)
      return
    }
    if (step === 1 && (!draft.name.trim() || !/^[+0-9() .-]+$/.test(draft.phone) || draft.phone.replace(/[^0-9]/g,'').length < 7)) {
      setError('Enter your name and a valid phone number.')
      return
    }
    if (step === 0 || step === 2) {
      if (!availableSlots(draft.date,data.bookings,data.blocked).includes(draft.time)) {
        setError('Choose an available appointment time.')
        setStep(0)
        return
      }
    }
    if (step === 2) {
      const id = '2S-' + crypto.randomUUID().slice(0,8).toUpperCase()
      const visit = draft.mode === 'visit' ? quote : null
      const km = visit?.km ?? 0
      const booking = {...draft, address:visit ? visitAddress.trim() || 'Visit pin: ' + pinText(visit.point) : SHOP, point:visit?.point ?? null, km, fee:travelFee(draft.mode,km), id, status:'Pending', paid:false}
      update(current => ({...current,bookings:[booking,...current.bookings]}))
      setCreated(booking)
    } else setStep(current => current + 1)
  }
  if(created) return <section className="wrap py-12"><div className="card max-w-xl p-8"><p className="eyebrow">Demo request received</p><h1 className="title mt-3">Booking requested</h1><p className="mt-5">Reference <strong>{created.id}</strong></p><p className="mt-2 text-muted">{formatDay(created.date)} at {formatTime(created.time)} · {created.address}</p><p className="mt-2 text-muted">Pending confirmation · {money(BASE_PRICE+created.fee)}{created.mode === 'visit' ? ' estimated' : ''}</p><a className="button mt-6" href="#bookings">View my bookings</a></div></section>
  return <section className="wrap py-10 sm:py-14">
    <p className="eyebrow">Vehicle checkup</p><h1 className="title mt-3">Book a checkup</h1>
    <ol className="my-7 flex flex-wrap gap-4 text-sm font-semibold">{['Schedule','Your details','Review'].map((label,index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={step === index ? 'text-brand' : 'text-muted'}>{index+1}. {label}</li>)}</ol>
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
      <form className="card grid gap-6 p-5 sm:p-8" onSubmit={advance}>
        {step === 0 && <>
          <fieldset><legend className="text-xl font-semibold">Where is the checkup?</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">{[['shop','At the shop'],['visit','At my location']].map(([id,label]) => <label key={id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line p-4 text-sm font-semibold has-checked:border-brand has-checked:bg-red-50"><input type="radio" checked={draft.mode === id} name="mode" onChange={() => change('mode',id)} className="accent-brand" />{label}</label>)}</div>
          </fieldset>
          {draft.mode === 'shop' ? <p className="text-sm text-muted">{SHOP}</p> : <Suspense fallback={<p role="status" className="text-sm text-muted">Loading location map…</p>}>
            <VisitMap quote={quote} address={visitAddress} onAddress={setVisitAddress} onQuote={value => { setQuote(value); setError('') }} />
          </Suspense>}
                    <Schedule data={data} value={draft} change={change}/>
        </>}
        {step === 1 && <><h2 className="text-xl font-semibold">Contact details</h2><div className="grid gap-4 sm:grid-cols-2">
          {[
            ['name','Full name',{autoComplete:'name'}],['email','Email address',{type:'email',autoComplete:'email'}],
            ['phone','Phone number',{type:'tel',autoComplete:'tel'}],
          ].map(([name,label,props]) => <Input key={name} name={name} label={label} value={draft[name]} change={change} required maxLength={120} {...props}/>)}
          <label className="label sm:col-span-2">Notes (optional)<textarea className="field font-normal" rows="3" maxLength="500" value={draft.notes} onChange={event => change('notes',event.target.value)} /></label>
        </div></>}
        {step === 2 && <><h2 className="text-xl font-semibold">Review your request</h2>
          <dl className="grid gap-4 text-sm">
            <div><dt className="font-semibold">Appointment</dt><dd>{formatDay(draft.date)} at {formatTime(draft.time)}</dd></div>
            <div><dt className="font-semibold">Location</dt><dd className="break-words">{draft.mode==='shop' ? SHOP : <>{visitAddress.trim() && <>{visitAddress.trim()}<br /></>}<a className="font-semibold text-brand underline" href={mapLink(quote.point)} target="_blank" rel="noreferrer">View visit pin</a> · {formatKm(quote.km)} by road</>}</dd></div>
            <div><dt className="font-semibold">Contact</dt><dd>{draft.name} · {draft.email} · {draft.phone}</dd></div>
          </dl>
          <p className="text-sm text-muted">Demo booking. Submission saves the request in this browser.</p>
        </>}
        {error && <p role="alert" className="text-sm text-brand">{error}</p>}
        <div className="flex flex-wrap gap-3">
          {step > 0 && <button className="button-outline" type="button" onClick={() => setStep(step-1)}>Back</button>}
          <button className="button" disabled={step === 0 && (!draft.time || (draft.mode === 'visit' && !quote))}>{['Continue to details','Review booking','Request booking'][step]}</button>
        </div>
      </form>
      <Price mode={draft.mode} km={quote?.km ?? null}/>
    </div>
  </section>
}

function MyBookings({data,update}) {
  const [editing,setEditing] = useState(null)
  const [draft,setDraft] = useState({date:'',time:''})
  const [notice,setNotice] = useState('')
  const [review,setReview] = useState(null)
  const change = (name,value) => setDraft(old => ({...old,[name]:value,...(name==='date'?{time:''}:{})}))
  function saveSchedule(event,booking) {
    event.preventDefault()
    if(!availableSlots(draft.date,data.bookings,data.blocked,booking.id).includes(draft.time)) {
      setNotice('Please select an available time.')
      return
    }
    update(current => ({...current,bookings:current.bookings.map(b=>b.id===booking.id?{...b,...draft,status:'Pending'}:b)}))
    setEditing(null)
    setNotice('Your reschedule request is pending.')
  }
  return <section className="wrap min-h-[55vh] py-12">
    <h1 className="title">My bookings</h1>
    <p className="mt-3 text-muted">Requests saved in this browser.</p>
    <p role="status" className="mt-4 text-sm font-semibold text-brand">{notice}</p>
    {!data.bookings.length && <div className="card mt-6 max-w-xl p-7"><h2 className="text-xl font-semibold">No bookings yet</h2><a className="button mt-4" href="#book">Book a checkup</a></div>}
    <div className="mt-6 grid gap-4">{data.bookings.map(booking => <article className="card grid gap-4 p-6" key={booking.id}>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Vehicle checkup</h2><p className="mt-1 text-sm text-muted">{booking.id} · {formatDay(booking.date)} at {formatTime(booking.time)}</p><p className="mt-1 break-words text-sm text-muted">{booking.address}{booking.point && <> · <a className="font-semibold text-brand underline" href={mapLink(booking.point)} target="_blank" rel="noreferrer">View visit pin</a></>} · {money(BASE_PRICE+booking.fee)}{booking.mode==='visit'?' estimated':''}</p></div><Badge status={booking.status}/></div>
      {openBooking(booking) && <div className="flex flex-wrap gap-2">
        <button className="button-outline" onClick={() => {setEditing(booking.id);setDraft({date:booking.date,time:booking.time})}}>Reschedule</button>
        <button className="button-outline" onClick={() => {
          if(window.confirm('Cancel booking '+booking.id+'?')) {
            update(current=>({...current,bookings:current.bookings.map(b=>b.id===booking.id?{...b,status:'Cancelled'}:b)}))
            setNotice('Booking cancelled.')
          }
        }}>Cancel booking</button>
      </div>}
      {editing===booking.id && openBooking(booking) && <form className="grid max-w-xl gap-4 border-t border-line pt-4" onSubmit={event=>saveSchedule(event,booking)}>
        <Schedule value={draft} change={change} data={data} ignoreId={booking.id}/>
        <div className="flex gap-2"><button className="button" disabled={!draft.time}>Request new time</button><button className="button-outline" type="button" onClick={()=>setEditing(null)}>Close</button></div>
      </form>}
      {booking.status==='Completed' && !data.feedback.some(item=>item.id===booking.id) && <div>
        {review!==booking.id ? <button className="button-outline" onClick={()=>setReview(booking.id)}>Leave feedback</button> : <form className="grid max-w-xl gap-3" onSubmit={event=>{
          event.preventDefault()
          const form=new FormData(event.currentTarget)
          update(current=>({...current,feedback:[{id:booking.id,name:booking.name,score:Number(form.get('score')),comment:form.get('comment').trim(),reviewed:false},...current.feedback]}))
          setReview(null);setNotice('Thanks for your feedback.')
        }}>
          <label className="label">Rating<select name="score" className="field" defaultValue="5">{[5,4,3,2,1].map(n=><option key={n}>{n}</option>)}</select></label>
          <label className="label">Comments<textarea name="comment" className="field" rows="3" maxLength="500" required /></label>
          <button className="button w-fit">Submit feedback</button>
        </form>}
      </div>}
    </article>)}</div>
  </section>
}

createRoot(document.getElementById('root')).render(<App/>)

