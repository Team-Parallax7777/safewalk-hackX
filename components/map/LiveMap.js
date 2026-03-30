'use client'

import { useEffect, useRef } from 'react'
import { useMap }    from '@/lib/context/MapContext'
import { useSafety } from '@/lib/context/SafetyContext'

// ── Mumbai bounding box ───────────────────────────────────
export const MUMBAI_BOUNDS = {
  minLat: 18.8900, maxLat: 19.2700,
  minLng: 72.7700, maxLng: 73.0700,
}
export const MUMBAI_CENTER = [19.0760, 72.8777]
export const MUMBAI_ZOOM   = 13

export function isInMumbai(lat, lng) {
  return (
    lat >= MUMBAI_BOUNDS.minLat && lat <= MUMBAI_BOUNDS.maxLat &&
    lng >= MUMBAI_BOUNDS.minLng && lng <= MUMBAI_BOUNDS.maxLng
  )
}

// ── Marker HTML factories ─────────────────────────────────
function userMarkerHTML() {
  return `<div style="position:relative;width:24px;height:24px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(232,153,74,0.25);animation:sw-pulse 1.8s cubic-bezier(0.215,0.61,0.355,1) infinite;"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#E8994A;box-shadow:0 0 0 2px #110F0C,0 0 16px rgba(232,153,74,0.6);"></div>
  </div>`
}

function reportMarkerHTML(severity = 'moderate') {
  const colors = { low:'#D4853A', moderate:'#C44B38', high:'#C44B38', sos:'#FF2D1A' }
  const color  = colors[severity] || '#C44B38'
  const size   = severity === 'sos' ? 28 : 20
  return `<div style="position:relative;width:${size}px;height:${size}px;cursor:pointer;">
    <div style="position:absolute;inset:0;border-radius:50%;background:${color}25;animation:sw-pulse 1.4s cubic-bezier(0.215,0.61,0.355,1) infinite;"></div>
    <div style="position:absolute;inset:${severity==='sos'?5:4}px;border-radius:50%;background:${color};box-shadow:0 0 0 2px #110F0C,0 0 12px ${color}80;"></div>
  </div>`
}

function guardianMarkerHTML() {
  return `<div style="position:relative;width:18px;height:18px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:#5B8FA820;animation:sw-pulse 2.4s cubic-bezier(0.215,0.61,0.355,1) infinite;"></div>
    <div style="position:absolute;inset:3px;border-radius:50%;background:#5B8FA8;box-shadow:0 0 0 2px #110F0C,0 0 10px #5B8FA860;"></div>
  </div>`
}

function injectStyles() {
  if (document.getElementById('sw-leaflet-styles')) return
  const style = document.createElement('style')
  style.id    = 'sw-leaflet-styles'
  style.textContent = `
    @keyframes sw-pulse {
      0%   { transform:scale(0.8); opacity:1; }
      100% { transform:scale(2.8); opacity:0; }
    }
    .leaflet-container { background:#110F0C !important; }
    .sw-popup .leaflet-popup-content-wrapper {
      background:#1C1916; color:#F5EDD8;
      border:1px solid rgba(196,75,56,0.35); border-radius:12px;
      box-shadow:0 8px 32px rgba(0,0,0,0.6);
      font-family:var(--font-outfit,sans-serif); font-size:13px; padding:0;
    }
    .sw-popup .leaflet-popup-tip  { background:#1C1916; }
    .sw-popup .leaflet-popup-content { margin:10px 14px; }
    .leaflet-control-attribution { display:none !important; }
    .leaflet-control-zoom { display:none !important; }
  `
  document.head.appendChild(style)
}

// ─────────────────────────────────────────────────────────

export default function LiveMap() {
  const { mapRef, setMapReady, userLocation, startLocationWatch } = useMap()
  const { reports, guardianLocations }                            = useSafety()

  const containerRef       = useRef(null)
  const leafletRef         = useRef(null)
  const userMarkerRef      = useRef(null)
  const reportMarkersRef   = useRef(new Map())
  const guardianMarkersRef = useRef(new Map())

  // ── Init Leaflet ──────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id    = 'leaflet-css'
      link.rel   = 'stylesheet'
      link.href  = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)
    }

    injectStyles()

    import('leaflet').then((mod) => {
      const L = mod.default
      leafletRef.current = L

      const map = L.map(containerRef.current, {
        center:              MUMBAI_CENTER,
        zoom:                MUMBAI_ZOOM,
        minZoom:             11,
        maxZoom:             18,
        // Hard boundary — user CANNOT pan outside Greater Mumbai
        maxBounds:           [
          [MUMBAI_BOUNDS.minLat, MUMBAI_BOUNDS.minLng],
          [MUMBAI_BOUNDS.maxLat, MUMBAI_BOUNDS.maxLng],
        ],
        maxBoundsViscosity:  1.0,   // Completely rigid, no elastic stretch
        zoomControl:         false,
        attributionControl:  false,
      })

      // CartoDB Dark Matter — free, no API key, dark aesthetic
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }
      ).addTo(map)

      // Warm sepia tint to match the Lantern Amber palette
      map.on('load', () => {
        const pane = containerRef.current?.querySelector('.leaflet-tile-pane')
        if (pane) pane.style.filter = 'sepia(0.2) hue-rotate(8deg) brightness(0.82) saturate(0.7)'
      })
      setTimeout(() => {
        const pane = containerRef.current?.querySelector('.leaflet-tile-pane')
        if (pane) pane.style.filter = 'sepia(0.2) hue-rotate(8deg) brightness(0.82) saturate(0.7)'
      }, 800)

      mapRef.current = map
      setMapReady(true)
      startLocationWatch()
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── User location marker ───────────────────────────────
  useEffect(() => {
    const L   = leafletRef.current
    const map = mapRef.current
    if (!L || !map || !userLocation) return

    const { lat, lng } = userLocation
    if (!isInMumbai(lat, lng)) return   // Don't track outside Mumbai

    const icon = L.divIcon({ html: userMarkerHTML(), className: '', iconSize: [24,24], iconAnchor: [12,12] })

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map)
      map.flyTo([lat, lng], 15, { duration: 1.5 })
    } else {
      userMarkerRef.current.setLatLng([lat, lng]).setIcon(icon)
    }
  }, [userLocation])

  // ── Report markers ─────────────────────────────────────
  useEffect(() => {
    const L   = leafletRef.current
    const map = mapRef.current
    if (!L || !map) return

    const existing   = reportMarkersRef.current
    const currentIds = new Set(reports.map((r) => r.id))

    existing.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); existing.delete(id) }
    })

    reports.forEach((report) => {
      if (existing.has(report.id)) return
      if (!isInMumbai(report.latitude, report.longitude)) return

      const icon   = L.divIcon({ html: reportMarkerHTML(report.severity), className: '', iconSize: [24,24], iconAnchor: [12,12] })
      const marker = L.marker([report.latitude, report.longitude], { icon })
        .addTo(map)
        .bindPopup(
          `<div>
            <strong style="color:#C44B38">⚠️ Reported Unsafe</strong><br/>
            <span style="color:#8A7D70;font-family:monospace;font-size:11px">
              ${new Date(report.created_at).toLocaleTimeString('en-IN')}
            </span>
          </div>`,
          { className: 'sw-popup' }
        )
      existing.set(report.id, marker)
    })
  }, [reports])

  // ── Guardian markers ───────────────────────────────────
  useEffect(() => {
    const L   = leafletRef.current
    const map = mapRef.current
    if (!L || !map) return

    const existing   = guardianMarkersRef.current
    const currentIds = new Set(guardianLocations.map((g) => g.guardian_id))

    existing.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); existing.delete(id) }
    })

    guardianLocations.forEach((g) => {
      if (!isInMumbai(g.latitude, g.longitude)) return
      if (existing.has(g.guardian_id)) {
        existing.get(g.guardian_id).setLatLng([g.latitude, g.longitude])
      } else {
        const icon   = L.divIcon({ html: guardianMarkerHTML(), className: '', iconSize: [18,18], iconAnchor: [9,9] })
        const marker = L.marker([g.latitude, g.longitude], { icon }).addTo(map)
        existing.set(g.guardian_id, marker)
      }
    })
  }, [guardianLocations])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      aria-label="SafeWalk live safety map — Mumbai"
    />
  )
}
