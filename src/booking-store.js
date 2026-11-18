import { useEffect, useRef, useState } from 'react'
import { initial } from './booking'

const storageKey = '2sog-workspace-v1'

function readData(fallback) {
  try {
    const value = localStorage.getItem(storageKey)
    return value ? { ...initial, ...JSON.parse(value) } : fallback
  } catch {
    return fallback
  }
}

export function useBookingData() {
  const [data, setData] = useState(() => readData(initial))
  const current = useRef(data)
  const storageUnavailable = useRef(false)

  useEffect(() => {
    function sync(event) {
      if (event.key !== storageKey && event.key !== null) return
      current.current = readData(initial)
      setData(current.current)
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function update(change) {
    const latest = storageUnavailable.current ? current.current : readData(current.current)
    const next = change(latest)
    current.current = next
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      storageUnavailable.current = false
    } catch {
      storageUnavailable.current = true
    }
    setData(next)
  }

  return [data, update]
}
