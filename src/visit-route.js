const env = import.meta.env
const referencePoint = { lat: 14.6501, lng: 121.1170 }

function coordinate(value, limit) {
  const number = Number(value)
  return value?.trim() && Number.isFinite(number) && Math.abs(number) <= limit ? number : null
}

const shopLat = coordinate(env.VITE_SHOP_LAT, 90)
const shopLng = coordinate(env.VITE_SHOP_LNG, 180)
export const usesReferencePoint = shopLat === null || shopLng === null
export const shopPoint = usesReferencePoint ? referencePoint : { lat: shopLat, lng: shopLng }
export const tileUrl = env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const tileAttribution = env.VITE_MAP_TILE_ATTRIBUTION || '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const router = (env.VITE_OSRM_URL || 'https://routing.openstreetmap.de/routed-car').replace(/\/+$/, '')

const routePoint = ({ lat, lng }) => lng.toFixed(6) + ',' + lat.toFixed(6)
export const pinText = ({ lat, lng }) => lat.toFixed(5) + ', ' + lng.toFixed(5)
export const mapLink = point => 'https://www.openstreetmap.org/?mlat=' + point.lat + '&mlon=' + point.lng + '#map=17/' + point.lat + '/' + point.lng
export const formatKm = km => km.toLocaleString('en-PH', { maximumFractionDigits: 3 }) + ' km'

export async function getDrivingRoute(point, signal) {
  const url = router + '/route/v1/driving/' + routePoint(shopPoint) + ';' + routePoint(point) + '?overview=simplified&geometries=geojson&radiuses=150;150&generate_hints=false'
  const response = await fetch(url, { signal, credentials: 'omit' })
  const data = await response.json()
  if (data.code === 'NoRoute' || data.code === 'NoSegment') {
    throw new Error('No driving route reaches this pin. Try placing it closer to a road.')
  }
  const route = data.routes?.[0]
  if (!response.ok || data.code !== 'Ok' || !Number.isFinite(route?.distance) || route.distance < 0) {
    throw new Error('The route estimate is unavailable. Try again or choose an at-the-shop checkup.')
  }
  return {
    point,
    km: route.distance / 1000,
    line: route.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) ?? [],
  }
}
