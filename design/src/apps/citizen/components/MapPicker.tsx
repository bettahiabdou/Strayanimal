import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, Loader2, AlertCircle } from 'lucide-react'

/* Custom red SVG marker (Vite doesn't bundle the default Leaflet PNG paths). */
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

type GeoState =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'ok' }
  | { kind: 'denied' } // user blocked permission
  | { kind: 'unavailable' } // no GPS / no signal
  | { kind: 'timeout' } // took too long
  | { kind: 'unsupported' } // browser doesn't expose API

type Props = {
  value: Coords | null
  onChange: (c: Coords) => void
  /** When true, on mount auto-tries the browser geolocation API. */
  autoLocate?: boolean
}

export function MapPicker({ value, onChange, autoLocate = true }: Props) {
  const center = value ?? OUARZAZATE
  const [geo, setGeo] = useState<GeoState>({ kind: 'idle' })

  function locate() {
    if (!('geolocation' in navigator)) {
      setGeo({ kind: 'unsupported' })
      if (!value) onChange(OUARZAZATE)
      return
    }
    setGeo({ kind: 'locating' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeo({ kind: 'ok' })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGeo({ kind: 'denied' })
        else if (err.code === err.POSITION_UNAVAILABLE) setGeo({ kind: 'unavailable' })
        else if (err.code === err.TIMEOUT) setGeo({ kind: 'timeout' })
        else setGeo({ kind: 'unavailable' })
        // Always seed a fallback so the map is usable even if GPS fails.
        if (!value) onChange(OUARZAZATE)
      },
      // 20s for first fix on mobile (GPS can take 10–15s after a cold start),
      // high accuracy uses GPS rather than wifi/IP triangulation.
      { timeout: 20000, enableHighAccuracy: true, maximumAge: 30000 },
    )
  }

  useEffect(() => {
    if (autoLocate && !value) locate()
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
        <ClickHandler
          onPick={(c) => {
            onChange(c)
            setGeo({ kind: 'ok' })
          }}
        />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            draggable
            icon={defaultIcon}
            eventHandlers={{
              dragend: (e) => {
                const ll = (e.target as L.Marker).getLatLng()
                onChange({ lat: ll.lat, lng: ll.lng })
                setGeo({ kind: 'ok' })
              },
            }}
          />
        )}
      </MapContainer>

      {/* Recenter / locate button */}
      <button
        type="button"
        onClick={locate}
        disabled={geo.kind === 'locating'}
        className="absolute top-2 end-2 z-[400] inline-flex items-center gap-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-800 px-3 py-1.5 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        aria-label="Détecter ma position"
      >
        {geo.kind === 'locating' ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Crosshair className="size-3.5" />
        )}
        {geo.kind === 'locating' ? 'Localisation…' : 'Ma position'}
      </button>

      {value && (
        <div className="absolute bottom-2 start-2 z-[400] bg-white/95 backdrop-blur border border-gray-200 rounded text-[11px] font-mono text-gray-700 px-2 py-1 shadow-sm">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </div>
      )}

      <GeoFeedback state={geo} onRetry={locate} />
    </div>
  )
}

function GeoFeedback({ state, onRetry }: { state: GeoState; onRetry: () => void }) {
  if (state.kind === 'ok' || state.kind === 'idle') {
    return (
      <p className="text-[11px] text-gray-500 px-3 py-2 bg-gray-50 border-t border-gray-200">
        Cliquez sur la carte ou faites glisser le repère pour ajuster la position.
      </p>
    )
  }
  if (state.kind === 'locating') {
    return (
      <p className="text-[11px] text-gray-700 px-3 py-2 bg-blue-50 border-t border-blue-200 inline-flex items-center gap-1.5 w-full">
        <Loader2 className="size-3.5 animate-spin" />
        Détection de votre position en cours… (jusqu’à 20 s sur mobile)
      </p>
    )
  }
  const messages: Record<Exclude<GeoState['kind'], 'ok' | 'idle' | 'locating'>, string> = {
    denied:
      'Vous avez refusé la géolocalisation. Activez-la dans les réglages du navigateur, ou cliquez sur la carte pour placer le repère manuellement.',
    unavailable:
      'GPS indisponible. Vérifiez que la localisation est activée sur votre téléphone, ou cliquez sur la carte pour placer le repère manuellement.',
    timeout:
      'La détection a pris trop de temps. Sortez à l’extérieur pour un meilleur signal, réessayez, ou placez le repère manuellement.',
    unsupported:
      'Votre navigateur ne supporte pas la géolocalisation. Cliquez sur la carte pour placer le repère.',
  }
  return (
    <div className="text-[11px] px-3 py-2 bg-amber-50 border-t border-amber-200 flex items-start gap-2">
      <AlertCircle className="size-3.5 text-amber-700 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-amber-900">{messages[state.kind]}</p>
        {state.kind !== 'unsupported' && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 text-amber-900 underline font-semibold"
          >
            Réessayer
          </button>
        )}
      </div>
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
