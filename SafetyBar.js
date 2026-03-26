'use client'

import { useState, useCallback } from 'react'
import {
  Navigation, AlertTriangle, Phone,
  ChevronUp, ChevronDown, MapPin,
  CheckCircle, Loader2,
} from 'lucide-react'
import { useSafety }   from '@/lib/context/SafetyContext'
import { useMap }      from '@/lib/context/MapContext'
import { useAuth }     from '@/lib/context/AuthContext'
import { cn }          from '@/lib/utils'

export default function SafetyBar() {
  const [expanded,    setExpanded]    = useState(false)
  const [reportState, setReportState] = useState('idle') // idle | loading | success | error
  const [reportMsg,   setReportMsg]   = useState('')

  const {
    walkActive, sosActive,
    startWalk, endWalk,
    fileReport, triggerSOS,
    nearbyGuardians,
  } = useSafety()

  const { userLocation, geoError } = useMap()
  const { profile }                = useAuth()

  // ── Report unsafe ──────────────────────────────────────
  const handleMarkUnsafe = useCallback(async () => {
    if (!userLocation) {
      setReportMsg('Waiting for your location…')
      return
    }
    setReportState('loading')
    try {
      await fileReport('moderate')
      setReportState('success')
      setReportMsg(`Reported. ${nearbyGuardians.length} guardian${nearbyGuardians.length !== 1 ? 's' : ''} alerted nearby.`)
      setTimeout(() => { setReportState('idle'); setReportMsg('') }, 4000)
    } catch (err) {
      setReportState('error')
      setReportMsg('Could not send report. Retrying…')
      setTimeout(() => { setReportState('idle'); setReportMsg('') }, 3000)
    }
  }, [userLocation, fileReport, nearbyGuardians.length])

  // ── SOS ────────────────────────────────────────────────
  const handleSOS = useCallback(async () => {
    try {
      await triggerSOS()
    } catch (err) {
      console.error('[SafeWalk SOS]', err)
    }
  }, [triggerSOS])

  // ── Emergency call ─────────────────────────────────────
  const handleEmergencyCall = () => {
    // Opens the device's native phone dialler
    window.location.href = 'tel:999'
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 pb-safe transition-all duration-400',
        'animate-slide-up'
      )}
    >
      {/* Expand/collapse handle */}
      <div
        className="mx-auto w-16 h-1 rounded-full bg-faint/60 mb-2 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-label={expanded ? 'Collapse safety panel' : 'Expand safety panel'}
      >
        <div className="sr-only">{expanded ? 'Collapse' : 'Expand'}</div>
      </div>

      {/* Main bar */}
      <div
        className="mx-3 mb-3 rounded-2xl overflow-hidden"
        style={{
          background:  'rgba(28,25,22,0.97)',
          border:      '1px solid rgba(232,153,74,0.12)',
          boxShadow:   '0 -8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Status strip */}
        {(reportMsg || geoError) && (
          <div
            className="px-4 py-2.5 text-center"
            style={{
              background: reportState === 'success'
                ? 'rgba(74,158,107,0.15)'
                : reportState === 'error' || geoError
                  ? 'rgba(196,75,56,0.15)'
                  : 'rgba(232,153,74,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <p className="font-mono text-xs" style={{
              color: reportState === 'success' ? '#4A9E6B'
                   : reportState === 'error'   ? '#C44B38'
                   : '#E8994A',
            }}>
              {geoError || reportMsg}
            </p>
          </div>
        )}

        {/* Main actions */}
        <div className="flex items-stretch gap-3 p-4">

          {/* Start / End Walk button */}
          <button
            onClick={walkActive ? endWalk : startWalk}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl haptic-tap',
              'transition-all duration-200 select-none',
              walkActive
                ? 'border border-safe/40'
                : ''
            )}
            style={
              walkActive
                ? { background: 'rgba(74,158,107,0.15)', boxShadow: '0 0 20px rgba(74,158,107,0.2)' }
                : { background: 'linear-gradient(135deg,#E8994A,#C47830)', boxShadow: '0 0 24px rgba(232,153,74,0.35)' }
            }
            aria-label={walkActive ? 'End walk' : 'Start walk'}
          >
            <Navigation
              size={22}
              className={walkActive ? 'text-safe' : 'text-void'}
              strokeWidth={2.5}
            />
            <span
              className="font-display font-bold text-xs tracking-wide"
              style={{ color: walkActive ? '#4A9E6B' : '#110F0C' }}
            >
              {walkActive ? 'END WALK' : 'START WALK'}
            </span>
          </button>

          {/* Mark Unsafe */}
          <button
            onClick={handleMarkUnsafe}
            disabled={reportState === 'loading'}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl haptic-tap
                       transition-all duration-200 select-none border border-warn/30"
            style={{ background: 'rgba(212,133,58,0.12)' }}
            aria-label="Mark current location as unsafe"
          >
            {reportState === 'loading' ? (
              <Loader2 size={22} className="text-warn animate-spin" />
            ) : reportState === 'success' ? (
              <CheckCircle size={22} className="text-safe" />
            ) : (
              <AlertTriangle size={22} className="text-warn" strokeWidth={2.5} />
            )}
            <span className="font-display font-bold text-xs text-warn tracking-wide">
              {reportState === 'loading' ? 'REPORTING…' : 'MARK UNSAFE'}
            </span>
          </button>

          {/* SOS button */}
          <button
            onClick={handleSOS}
            className={cn(
              'w-20 flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl haptic-tap',
              'transition-all duration-200 select-none',
              sosActive ? 'animate-sos-pulse' : ''
            )}
            style={{
              background:  'linear-gradient(135deg,#C44B38,#8B2A1A)',
              boxShadow:   sosActive
                ? '0 0 32px rgba(196,75,56,0.7)'
                : '0 0 16px rgba(196,75,56,0.35)',
            }}
            aria-label="Send SOS — emergency alert to all nearby guardians"
          >
            <span className="text-2xl leading-none">🆘</span>
            <span className="font-display font-bold text-xs text-cream tracking-widest">SOS</span>
          </button>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div
            className="px-4 pb-4 space-y-3 border-t animate-slide-up"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <div className="pt-3">
              {/* Coordinates */}
              {userLocation && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ash/40 mb-3">
                  <MapPin size={14} className="text-amber flex-shrink-0" />
                  <p className="font-mono text-xs text-muted">
                    {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                  </p>
                  <span
                    className="ml-auto font-mono text-xs"
                    style={{ color: userLocation.accuracy <= 20 ? '#4A9E6B' : '#D4853A' }}
                  >
                    ±{Math.round(userLocation.accuracy)}m
                  </span>
                </div>
              )}

              {/* Nearby guardians count */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-ash/40 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-guardian animate-safe-pulse" />
                  <span className="font-body text-sm text-cream">Guardians nearby</span>
                </div>
                <span className="font-mono text-sm font-medium text-guardian">
                  {nearbyGuardians.length}
                </span>
              </div>

              {/* Emergency call */}
              <button
                onClick={handleEmergencyCall}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl haptic-tap
                           border border-sos/30 transition-all"
                style={{ background: 'rgba(196,75,56,0.08)' }}
                aria-label="Call emergency services"
              >
                <Phone size={18} className="text-sos" />
                <span className="font-display font-semibold text-sm text-sos">
                  Call Emergency Services
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Expand chevron */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center py-2 haptic-tap"
          aria-label={expanded ? 'Collapse' : 'More options'}
        >
          {expanded
            ? <ChevronDown size={16} className="text-muted" />
            : <ChevronUp   size={16} className="text-muted" />
          }
        </button>
      </div>
    </div>
  )
}
