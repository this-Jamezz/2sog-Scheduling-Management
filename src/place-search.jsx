import React, { useEffect, useRef, useState } from 'react'

const endpoint = import.meta.env.VITE_PLACE_SEARCH_URL || 'https://photon.komoot.io/api/'

async function findPlaces(query, signal) {
  const url = new URL(endpoint, window.location.origin)
  url.search = new URLSearchParams({ q: query, limit: '7', bbox: '116,4.5,127,22' })
  const response = await fetch(url, { signal, credentials: 'omit' })
  if (!response.ok) throw new Error('Location search is unavailable')
  const { features } = await response.json()
  return features.flatMap(({ geometry, properties }) => {
    if (geometry?.type !== 'Point' || !properties) return []
    const [lng, lat] = geometry.coordinates
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (properties.countrycode && properties.countrycode !== 'PH')) return []
    const label = [...new Set([properties.name, properties.street, properties.district, properties.city, properties.county, properties.state].filter(Boolean))].join(', ')
    return label ? [{ point: { lat, lng }, label }] : []
  })
}

export default function PlaceSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const request = useRef(null)
  useEffect(() => () => request.current?.abort(), [])

  async function search() {
    const term = query.trim()
    if (term.length < 3 || request.current) return
    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setMessage('')
    try {
      const found = await findPlaces(term, AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]))
      if (request.current !== controller) return
      setResults(found)
      setMessage(found.length ? found.length + ' locations found.' : 'No matching locations. Try adding a city or pin the location on the map.')
    } catch {
      if (request.current === controller) setMessage('Search could not load. Try again or place the pin directly on the map.')
    } finally {
      if (request.current === controller) {
        request.current = null
        setBusy(false)
      }
    }
  }

  return <div role="search" aria-label="Find a visit location" className="grid gap-2">
    <label className="label" htmlFor="visit-place-search">Search locations</label>
    <div className="flex gap-2">
      <input id="visit-place-search" type="search" enterKeyHint="search" value={query} maxLength={120} autoComplete="off"
        className="field mt-0 min-w-0" placeholder="City, barangay, or landmark" onChange={event => {
          request.current?.abort()
          request.current = null
          setBusy(false)
          setQuery(event.target.value)
          setResults([])
          setMessage('')
        }} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); search() } }} />
      <button type="button" className="button-outline px-3 sm:px-5" disabled={query.trim().length < 3 || busy} onClick={search}>{busy ? 'Searching…' : 'Search'}</button>
    </div>
    {message && <p role="status" className="text-sm text-muted">{message}</p>}
    {!!results.length && <ul aria-label="Location results" className="max-h-52 divide-y divide-line overflow-auto rounded-lg border border-line bg-white">
      {results.map(({ point, label }, index) => <li key={label + index}><button type="button" className="block w-full px-3 py-2.5 text-left text-sm hover:bg-paper focus-visible:-outline-offset-2" onClick={() => {
        onSelect(point, label)
        setResults([])
        setMessage('Location pinned. Adjust it on the map if needed.')
      }}>{label}</button></li>)}
    </ul>}
    <p className="text-xs text-muted">Search for a public place or area. Add private address details in the field below the map. <a className="underline" href="https://github.com/komoot/photon" target="_blank" rel="noreferrer">Search by Photon</a></p>
  </div>
}
