import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, Loader2 } from 'lucide-react'

/* Fix the default Leaflet icon paths (Vite doesn't bundle them automatically). */
const defaultIcon = L.icon({
  iconUrl:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="46" viewBox="0 0 32 46">
  <path d="M16 0C7.16 0 0 7.16 0 16c0 11 16 30 16 30s16-19 16-30c0-8.84-7.16-16-16-16z"
        fill="#C1272D" stroke="#fff" stroke-width="2"/>
  <circle cx="16" cy="16" r="6" fill="#fff"/>
</svg>`),
  iconSize: [32, 46],
  iconAnchor: [16, 46],
  popupAnchor: [0, -46],
})

const OUARZAZATE = { lat: 30.92, lng: -6.91 }

type Coords = { lat: number; lng: number }

type Props = {
  value: Coords | null
  onChange: (c: Coords) => void
  /** When true, on mount auto-tries the browser geolocation API. */
  autoLocate?: boolean
}

export function MapPicker({ value, onChange, autoLocate = true }: Props) {
  const center = value ?? OUARZAZATE
  const [locating, setLocating] = useState(false)

  // On first mount, ask the browser for the user's position.
  useEffect(() => {
    if (!autoLocate || value || !('geolocation' in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        // Fallback to Ouarzazate centre if denied/timeout/etc.
        onChange(OUARZAZATE)
        setLocating(false)
      },
      { timeout: 6000, enableHighAccuracy: false },
    )
  }, [])

  return (
    <div className="rounded-lg overflow-hidden border border-gray-300 relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={value ? 15 : 13}
        scrollWheelZoom
        style={{ height: 280, width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        <FollowMarker value={value} />
        <ClickHandler onPick={onChange} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            draggable
            icon={defaultIcon}
            eventHandlers={{
              dragend: (e) => {
                const ll = (e.target as L.Marker).getLatLng()
                onChange({ lat: ll.lat, lng: ll.lng })
              },
            }}
          />
        )}
      </MapContainer>

      {/* Recenter to GPS button */}
      <button
        type="button"
        onClick={() => {
          if (!('geolocation' in navigator)) return
          setLocating(true)
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
              setLocating(false)
            },
            () => {
              setLocating(false)
            },
            { timeout: 6000, enableHighAccuracy: true },
          )
        }}
        disabled={locating}
        className="absolute top-2 end-2 z-[400] inline-flex items-center gap-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-800 px-3 py-1.5 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        aria-label="Recentrer sur ma position"
      >
        {locating ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Crosshair className="size-3.5" />
        )}
        Ma position
      </button>

      {value && (
        <div className="absolute bottom-2 start-2 z-[400] bg-white/95 backdrop-blur border border-gray-200 rounded text-[11px] font-mono text-gray-700 px-2 py-1 shadow-sm">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </div>
      )}

      <p className="text-[11px] text-gray-500 px-3 py-2 bg-gray-50 border-t border-gray-200">
        Cliquez sur la carte ou faites glisser le repère pour ajuster la position.
      </p>
    </div>
  )
}

/* Recenter the map view when value changes externally (e.g. after geolocation). */
function FollowMarker({ value }: { value: Coords | null }) {
  const map = useMap()
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15))
  }, [value?.lat, value?.lng])
  return null
}

/* Single click on the map drops/moves the pin. */
function ClickHandler({ onPick }: { onPick: (c: Coords) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}
