'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useMap }    from '@/lib/context/MapContext'
import { useSafety } from '@/lib/context/SafetyContext'

// Mapbox token from env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// ── Custom SVG Marker Factories ────────────────────────────

function createUserMarkerEl() {
  const el = document.createElement('div')
  el.className = 'user-marker'
  el.innerHTML = `
    <div style="
      position: relative;
      width: 24px;
      height: 24px;
    ">
      <div style="
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: rgba(232,153,74,0.25);
        animation: pulse-ring 1.8s cubic-bezier(0.215,0.61,0.355,1) infinite;
      "></div>
      <div style="
        position: absolute;
        inset: 4px;
        border-radius: 50%;
        background: #E8994A;
        box-shadow: 0 0 0 2px #110F0C, 0 0 16px rgba(232,153,74,0.6);
      "></div>
    </div>
  `
  // Inject keyframes once
  if (!document.getElementById('marker-keyframes')) {
    const style = document.createElement('style')
    style.id = 'marker-keyframes'
    style.textContent = `
      @keyframes pulse-ring {
        0%   { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(2.8); opacity: 0; }
      }
      @keyframes sos-ring {
        0%   { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(3.2); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
  return el
}

function createReportMarkerEl(severity = 'moderate') {
  const colorMap = {
    low:      '#D4853A',
    moderate: '#C44B38',
    high:     '#C44B38',
    sos:      '#FF2D1A',
  }
  const color  = colorMap[severity] || '#C44B38'
  const size   = severity === 'sos' ? 28 : 20
  const animation = severity === 'sos' ? 'sos-ring' : 'pulse-ring'

  const el = document.createElement('div')
  el.style.cssText = `position:relative;width:${size}px;height:${size}px;cursor:pointer`
  el.innerHTML = `
    <div style="
      position:absolute;inset:0;border-radius:50%;
      background:${color}20;
      animation:${animation} 1.4s cubic-bezier(0.215,0.61,0.355,1) infinite;
    "></div>
    <div style="
      position:absolute;inset:${size === 28 ? 5 : 4}px;border-radius:50%;
      background:${color};
      box-shadow:0 0 0 2px #110F0C,0 0 12px ${color}80;
    "></div>
  `
  return el
}

function createGuardianMarkerEl(isMoving = false) {
  const el = document.createElement('div')
  el.style.cssText = 'position:relative;width:18px;height:18px;cursor:pointer'
  el.innerHTML = `
    <div style="
      position:absolute;inset:0;border-radius:50%;
      background:#5B8FA820;
      ${isMoving ? 'animation:pulse-ring 2s cubic-bezier(0.215,0.61,0.355,1) infinite;' : ''}
    "></div>
    <div style="
      position:absolute;inset:3px;border-radius:50%;
      background:#5B8FA8;
      box-shadow:0 0 0 2px #110F0C,0 0 10px #5B8FA860;
    "></div>
  `
  return el
}

// ─────────────────────────────────────────────────────────────

export default function LiveMap() {
  const { mapRef, setMapReady, userLocation, startLocationWatch } = useMap()
  const { reports, guardianLocations }                            = useSafety()
  const containerRef   = useRef(null)
  const userMarkerRef  = useRef(null)
  const reportMarkersRef   = useRef(new Map())
  const guardianMarkersRef = useRef(new Map())
  const mapboxglRef    = useRef(null)

  // ── Initialize Mapbox ──────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    if (!MAPBOX_TOKEN) {
      console.error('[SafeWalk] NEXT_PUBLIC_MAPBOX_TOKEN is not set.')
      return
    }

    let map

    // Dynamic import (avoid SSR issues with window)
    import('mapbox-gl').then((mapboxgl) => {
      mapboxglRef.current = mapboxgl.default
      mapboxgl.default.accessToken = MAPBOX_TOKEN

      map = new mapboxgl.default.Map({
        container:   containerRef.current,
        style:       'mapbox://styles/mapbox/dark-v11',
        center:      [0, 51.5],   // Default: London; will fly to user on location
        zoom:        13,
        pitch:       30,
        bearing:     0,
        antialias:   true,
        fadeDuration: 0,
      })

      mapRef.current = map

      map.on('load', () => {
        // Apply warm dark color overrides
        applyWarmVoidStyle(map)

        // Add heat map source
        map.addSource('reports-heat', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })

        map.addLayer({
          id:   'reports-heat-layer',
          type: 'heatmap',
          source: 'reports-heat',
          paint: {
            'heatmap-weight':   ['interpolate', ['linear'], ['get', 'severity_num'], 0, 0, 4, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 16, 3],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(232,153,74,0)',
              0.3, 'rgba(212,133,58,0.4)',
              0.6, 'rgba(196,75,56,0.6)',
              0.9, 'rgba(196,75,56,0.85)',
              1, 'rgba(255,45,26,1)',
            ],
            'heatmap-radius':   ['interpolate', ['linear'], ['zoom'], 0, 2, 16, 40],
            'heatmap-opacity':  0.72,
          },
        })

        setMapReady(true)
        startLocationWatch()
      })

      // Disable rotation on mobile (prevents accidental map spinning)
      map.dragRotate.disable()
      map.touchZoomRotate.disableRotation()
    })

    return () => {
      if (map) {
        map.remove()
        mapRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── User location marker ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation || !mapboxglRef.current) return

    const { lat, lng } = userLocation
    const mapboxgl     = mapboxglRef.current

    if (!userMarkerRef.current) {
      userMarkerRef.current = new mapboxgl.Marker({ element: createUserMarkerEl(), anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(mapRef.current)

      // First time — fly to user
      mapRef.current.flyTo({
        center:    [lng, lat],
        zoom:      15,
        speed:     1.2,
        essential: true,
      })
    } else {
      // Smooth marker update via requestAnimationFrame
      requestAnimationFrame(() => {
        userMarkerRef.current.setLngLat([lng, lat])
      })
    }
  }, [userLocation])

  // ── Report markers ─────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapboxglRef.current) return

    const mapboxgl = mapboxglRef.current
    const existing = reportMarkersRef.current
    const currentIds = new Set(reports.map((r) => r.id))

    // Remove stale markers
    existing.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove()
        existing.delete(id)
      }
    })

    // Add new markers
    reports.forEach((report) => {
      if (!existing.has(report.id)) {
        const el     = createReportMarkerEl(report.severity)
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([report.longitude, report.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 16, className: 'sw-popup' }).setHTML(
              `<div style="
                background:#1C1916;color:#F5EDD8;
                font-family:var(--font-outfit,sans-serif);
                font-size:13px;padding:10px 14px;border-radius:10px;
                border:1px solid rgba(196,75,56,0.4);
              ">
                <strong style="color:#C44B38;font-size:14px">⚠️ Reported Unsafe</strong><br/>
                <span style="color:#8A7D70;font-size:11px;font-family:monospace">
                  ${new Date(report.created_at).toLocaleTimeString()}
                </span>
              </div>`
            )
          )
          .addTo(mapRef.current)
        existing.set(report.id, marker)
      }
    })

    // Update heatmap source
    if (mapRef.current.getSource('reports-heat')) {
      mapRef.current.getSource('reports-heat').setData({
        type: 'FeatureCollection',
        features: reports.map((r) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
          properties: {
            severity_num: { low: 1, moderate: 2, high: 3, sos: 4 }[r.severity] || 2,
          },
        })),
      })
    }
  }, [reports])

  // ── Guardian markers ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapboxglRef.current) return

    const mapboxgl = mapboxglRef.current
    const existing = guardianMarkersRef.current
    const currentIds = new Set(guardianLocations.map((g) => g.guardian_id))

    existing.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); existing.delete(id) }
    })

    guardianLocations.forEach((g) => {
      if (existing.has(g.guardian_id)) {
        requestAnimationFrame(() =>
          existing.get(g.guardian_id).setLngLat([g.longitude, g.latitude])
        )
      } else {
        const el     = createGuardianMarkerEl(false)
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([g.longitude, g.latitude])
          .addTo(mapRef.current)
        existing.set(g.guardian_id, marker)
      }
    })
  }, [guardianLocations])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      aria-label="SafeWalk live safety map"
    />
  )
}

// Apply warm dark style overrides after map load
function applyWarmVoidStyle(map) {
  const warmOverrides = [
    ['background', 'background-color', '#110F0C'],
    ['water',      'fill-color',       '#0D1215'],
    ['landuse',    'fill-color',       '#161210'],
    ['road-street','line-color',       '#2A2218'],
    ['road-secondary-tertiary', 'line-color', '#221D15'],
    ['road-primary', 'line-color',     '#2E2619'],
    ['building',   'fill-color',       '#1A1611'],
    ['building',   'fill-outline-color','#221D15'],
  ]

  warmOverrides.forEach(([layer, prop, value]) => {
    try {
      if (map.getLayer(layer)) {
        map.setPaintProperty(layer, prop, value)
      }
    } catch (_) { /* Layer may not exist in this style */ }
  })
}
