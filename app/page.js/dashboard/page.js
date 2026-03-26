'use client'

import dynamic         from 'next/dynamic'
import { useState }    from 'react'
import AuraHeader      from '@/components/layout/AuraHeader'
import SafetyBar       from '@/components/ui/SafetyBar'
import GuardianPanel   from '@/components/ui/GuardianPanel'
import { useMap }      from '@/lib/context/MapContext'

// Dynamic import: Mapbox cannot run on server (uses window)
const LiveMap = dynamic(() => import('@/components/map/LiveMap'), {
  ssr:     false,
  loading: () => <MapSkeleton />,
})

export default function DashboardPage() {
  const [panelOpen, setPanelOpen] = useState(false)
  const { geoError }              = useMap()

  return (
    <main className="relative w-full h-screen overflow-hidden bg-void">

      {/* Full-bleed map layer */}
      <LiveMap />

      {/* Sticky header with Aura */}
      <AuraHeader onMenuOpen={() => setPanelOpen(true)} />

      {/* Fixed bottom safety controls */}
      <SafetyBar />

      {/* Guardian side panel (full-screen overlay) */}
      {panelOpen && (
        <GuardianPanel onClose={() => setPanelOpen(false)} />
      )}

      {/* Geo permission prompt */}
      {geoError && (
        <GeoPermissionBanner error={geoError} />
      )}
    </main>
  )
}

function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-void">
      <div className="text-center space-y-4 animate-fade-in">
        {/* Lantern pulse animation */}
        <div className="relative mx-auto w-16 h-16">
          <div
            className="absolute inset-0 rounded-full animate-pulse-ring"
            style={{ background: 'rgba(232,153,74,0.2)' }}
          />
          <div
            className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{
              background:  'linear-gradient(135deg, #E8994A, #C47830)',
              boxShadow:   '0 0 32px rgba(232,153,74,0.5)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="#110F0C" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>
        <p className="font-mono text-xs text-muted">Loading SafeWalk…</p>
      </div>
    </div>
  )
}

function GeoPermissionBanner({ error }) {
  return (
    <div
      className="fixed top-28 left-4 right-4 z-30 px-4 py-3 rounded-xl animate-fade-in"
      style={{
        background: 'rgba(196,75,56,0.15)',
        border:     '1px solid rgba(196,75,56,0.3)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="font-body text-xs text-sos leading-relaxed">
        ⚠️ <strong>Location required:</strong> {error}.<br />
        Please enable location access in your browser settings for SafeWalk to work.
      </p>
    </div>
  )
}
