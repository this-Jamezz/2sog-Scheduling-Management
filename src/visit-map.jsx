import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PlaceSearch from './place-search'
import { formatKm, getDrivingRoute, pinText, shopPoint, tileAttribution, tileUrl, usesReferencePoint } from './visit-route'

function markerIcon(color) {
  return L.divIcon({
    className: 'visit-pin',
    html: '<span style="background:' + color + '"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export default function VisitMap({ quote, onQuote, address, onAddress }) {
  const element = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const routeLayer = useRef(null)
  const request = useRef(null)
  const selectPin = useRef(null)
  const lastRequest = useRef(0)
  const [point, setPoint] = useState(quote?.point ?? null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [tilesUnavailable, setTilesUnavailable] = useState(false)

  selectPin.current = next => {
    request.current?.abort()
    request.current = null
    setPending(false)
    setError('')
    setPoint({ lat: next.lat, lng: next.lng })
    onQuote(null)
  }

  useEffect(() => {
    const view = L.map(element.current, { scrollWheelZoom: false }).setView(quote?.point ?? shopPoint, 14)
    map.current = view
    const tiles = L.tileLayer(tileUrl, { maxZoom: 19, attribution: tileAttribution })
    let tileLoaded = false
    tiles.on('tileload', () => { tileLoaded = true; setTilesUnavailable(false) })
    tiles.on('tileerror', () => { if (!tileLoaded) setTilesUnavailable(true) }).addTo(view)
    L.marker(shopPoint, {
      icon: markerIcon('#191d21'),
      title: usesReferencePoint ? 'Marikina Heights reference point' : '2Sog shop',
    }).addTo(view)
    view.on('click', event => selectPin.current(event.latlng.wrap()))
    return () => {
      request.current?.abort()
      view.remove()
      map.current = marker.current = routeLayer.current = null
    }
  }, [])

  useEffect(() => {
    marker.current?.remove()
    if (!point || !map.current) return
    marker.current = L.marker(point, {
      draggable: true,
      icon: markerIcon('#c61f2b'),
      title: 'Visit pin',
    }).addTo(map.current)
    marker.current.on('dragend', event => selectPin.current(event.target.getLatLng().wrap()))
  }, [point])

  useEffect(() => {
    routeLayer.current?.remove()
    if (!map.current || !quote?.line?.length) return
    routeLayer.current = L.polyline(quote.line, { color: '#c61f2b', weight: 4, opacity: 0.85, interactive: false }).addTo(map.current)
    map.current.fitBounds(routeLayer.current.getBounds(), { padding: [30, 30], maxZoom: 16 })
  }, [quote])

  async function estimate() {
    if (!point || pending || quote) return
    setPending(true)
    setError('')
    const controller = new AbortController()
    request.current = controller
    const wait = Math.max(0, 1000 - (Date.now() - lastRequest.current))
    if (wait) await new Promise(resolve => setTimeout(resolve, wait))
    if (controller.signal.aborted) return
    lastRequest.current = Date.now()
    const timeout = AbortSignal.timeout(12000)
    try {
      const result = await getDrivingRoute(point, AbortSignal.any([controller.signal, timeout]))
      if (request.current === controller) onQuote(result)
    } catch (failure) {
      if (request.current === controller) {
        setError(failure.message.startsWith('No driving route') ? failure.message : 'Could not calculate a driving route. Try again or choose an at-the-shop checkup.')
      }
    } finally {
      if (request.current === controller) {
        request.current = null
        setPending(false)
      }
    }
  }

  return <section className="grid gap-3" aria-labelledby="visit-map-title">
    <div><h2 id="visit-map-title" className="text-lg font-semibold">Pin your visit location</h2><p className="mt-1 text-sm text-muted">Tap the map or move it and select its center. Place the pin near the entrance or nearest road.</p></div>
    <PlaceSearch onSelect={(location, label) => {
      selectPin.current(location)
      map.current.setView(location, 16, { animate: false })
      onAddress(label)
    }} />
    <div className="relative isolate overflow-hidden rounded-xl border border-line bg-[#e8edf0]">
      <div ref={element} className="h-72 w-full sm:h-80" role="region" aria-label="Interactive visit map" />
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 z-[450] -translate-x-1/2 -translate-y-1/2 text-2xl font-semibold text-ink [text-shadow:0_0_4px_white]">+</span>
    </div>
    <p className="text-xs text-muted">Use + and − to zoom, or pinch on a touchscreen.</p>
    <label className="label">Visit address <span className="font-normal text-muted">(optional)</span>
      <input className="field font-normal" autoComplete="street-address" value={address} maxLength={300} onChange={event => onAddress(event.target.value)} placeholder="House or unit number, street, or nearby landmark" aria-describedby="visit-address-help" />
    </label>
    <p id="visit-address-help" className="text-xs text-muted">Edit the address to help 2Sog find you. Move the map pin to change the travel estimate.</p>
    {tilesUnavailable && <p role="status" className="text-sm text-brand">Map images couldn’t load. Check your connection and reload before placing a pin.</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" className="button-outline" disabled={tilesUnavailable} onClick={() => selectPin.current(map.current.getCenter().wrap())}>Pin map center</button>
      <button type="button" className="button" onClick={estimate} disabled={!point || pending || !!quote || tilesUnavailable}>{pending ? 'Calculating…' : quote ? 'Estimate ready' : 'Calculate travel fee'}</button>
    </div>
    <p aria-live="polite" className="text-sm text-muted">{quote ? 'Driving distance: ' + formatKm(quote.km) : point ? 'Selected pin: ' + pinText(point) : 'Select a visit pin to calculate the driving distance.'}</p>
    {error && <p role="alert" className="text-sm text-brand">{error}</p>}
    <p className="text-xs text-muted">Calculating sends the pin to the routing provider. {usesReferencePoint && 'Distance starts at a Marikina Heights reference point. '}<a className="underline" href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Report a map issue</a></p>
  </section>
}
