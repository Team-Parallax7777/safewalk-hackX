'use client'

import { useState, useCallback } from 'react'
import { X, ShieldCheck, MapPin, Clock, Award, Users, TrendingUp } from 'lucide-react'
import { useAuth }   from '@/lib/context/AuthContext'
import { useSafety } from '@/lib/context/SafetyContext'
import { useMap }    from '@/lib/context/MapContext'
import { cn }        from '@/lib/utils'

const AURA_COLORS = {
  New:        '#8A7D70',
  Trusted:    '#E8994A',
  High:       '#E8994A',
  'Very High': '#F0B070',
  Elite:       '#FFD700',
}

export default function GuardianPanel({ onClose }) {
  const { profile, isGuardian, togglePatrol, sendOTP, verifyOTP } = useAuth()
  const { nearbyGuardians, reports }  = useSafety()
  const { userLocation }              = useMap()

  const [authStep,  setAuthStep]  = useState('idle')  // idle | email | otp | done
  const [email,     setEmail]     = useState('')
  const [otp,       setOtp]       = useState('')
  const [authError, setAuthError] = useState('')
  const [loading,   setLoading]   = useState(false)

  const handleSendOTP = useCallback(async () => {
    if (!email) return
    setLoading(true)
    setAuthError('')
    try {
      await sendOTP(email)
      setAuthStep('otp')
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }, [email, sendOTP])

  const handleVerifyOTP = useCallback(async () => {
    if (!otp) return
    setLoading(true)
    setAuthError('')
    try {
      await verifyOTP(email, otp)
      setAuthStep('done')
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }, [email, otp, verifyOTP])

  const auraColor = AURA_COLORS[profile?.aura_level || 'New']

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: 'rgba(17,15,12,0.97)', backdropFilter: 'blur(16px)' }}
    >
      {/* Header */}
      <div className="aura-header px-4 py-4 flex items-center justify-between pt-safe">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${auraColor}33, ${auraColor}11)`,
              border:     `1px solid ${auraColor}40`,
            }}
          >
            <ShieldCheck size={18} style={{ color: auraColor }} />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg leading-tight">
              Guardian Hub
            </h2>
            <p className="font-mono text-xs text-muted">
              {isGuardian ? `Aura: ${profile?.aura_level}` : 'Become a Guardian'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-ash/60 flex items-center justify-center haptic-tap"
          aria-label="Close panel"
        >
          <X size={18} className="text-cream" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* ── Guardian signup / status ── */}
        {!isGuardian ? (
          <div
            className="card-surface p-5 space-y-4"
            style={{ border: `1px solid ${auraColor}25` }}
          >
            <div>
              <h3 className="font-display font-bold text-base mb-1">
                Become a Guardian
              </h3>
              <p className="font-body text-sm text-muted leading-relaxed">
                Verified community members who receive "gentle nudges" when someone nearby marks an unsafe location.
              </p>
            </div>

            {authStep === 'idle' && (
              <button
                onClick={() => setAuthStep('email')}
                className="btn-amber w-full text-sm"
              >
                Register with Email
              </button>
            )}

            {authStep === 'email' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="font-mono text-xs text-muted mb-1.5 block">Your Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-ash/60 border border-faint/40 rounded-xl px-4 py-3
                               font-body text-sm text-cream placeholder-muted/60
                               focus:outline-none focus:border-amber/60"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  />
                </label>
                <button
                  onClick={handleSendOTP}
                  disabled={loading || !email}
                  className="btn-amber w-full text-sm disabled:opacity-50"
                >
                  {loading ? 'Sending…' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {authStep === 'otp' && (
              <div className="space-y-3">
                <p className="font-body text-xs text-muted">
                  We sent a 6-digit code to <span className="text-cream">{email}</span>
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-ash/60 border border-faint/40 rounded-xl px-4 py-3
                             font-mono text-xl text-center tracking-widest text-amber
                             focus:outline-none focus:border-amber/60"
                />
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length < 6}
                  className="btn-amber w-full text-sm disabled:opacity-50"
                >
                  {loading ? 'Verifying…' : 'Verify & Join'}
                </button>
              </div>
            )}

            {authStep === 'done' && (
              <div className="text-center py-2">
                <p className="font-display font-bold text-safe text-lg">✓ You are now a Guardian!</p>
                <p className="font-body text-xs text-muted mt-1">Enable patrol mode in the header to go live.</p>
              </div>
            )}

            {authError && (
              <p className="font-mono text-xs text-sos">{authError}</p>
            )}
          </div>
        ) : (
          /* Guardian is verified — show status */
          <div
            className="card-surface p-5"
            style={{
              border:     `1px solid ${auraColor}30`,
              background: `linear-gradient(135deg, rgba(28,25,22,1), ${auraColor}08)`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-bold text-base">Your Aura</span>
              <span
                className="font-mono text-sm font-bold"
                style={{ color: auraColor }}
              >
                {profile?.aura_level}
              </span>
            </div>

            {/* Aura score bar */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="font-mono text-xs text-muted">Score</span>
                <span className="font-mono text-xs" style={{ color: auraColor }}>
                  {profile?.aura_score || 0} pts
                </span>
              </div>
              <div className="w-full h-1.5 bg-ash rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width:      `${Math.min(100, ((profile?.aura_score || 0) / 500) * 100)}%`,
                    background: `linear-gradient(90deg, ${auraColor}, ${auraColor}80)`,
                  }}
                />
              </div>
              <p className="font-mono text-xs text-faint">
                {500 - (profile?.aura_score || 0)} points to Elite
              </p>
            </div>

            <PatrolToggle
              active={profile?.patrol_active || false}
              onToggle={togglePatrol}
            />
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Users size={16} className="text-guardian" />}
            label="Nearby"
            value={nearbyGuardians.length}
            color="#5B8FA8"
          />
          <StatCard
            icon={<AlertTriangleSmall />}
            label="Active"
            value={reports.length}
            color="#C44B38"
          />
          <StatCard
            icon={<MapPin size={16} className="text-amber" />}
            label="Accuracy"
            value={userLocation ? `${Math.round(userLocation.accuracy)}m` : '--'}
            color="#E8994A"
          />
        </div>

        {/* ── Nearby guardians list ── */}
        {nearbyGuardians.length > 0 && (
          <div className="card-surface p-4 space-y-2">
            <h3 className="font-display font-semibold text-sm text-muted uppercase tracking-widest mb-3">
              Nearby Guardians
            </h3>
            {nearbyGuardians.slice(0, 5).map((g) => (
              <GuardianRow key={g.guardian_id} guardian={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PatrolToggle({ active, onToggle }) {
  return (
    <button
      onClick={() => onToggle(!active)}
      className={cn(
        'w-full flex items-center justify-between px-4 py-3 rounded-xl haptic-tap',
        'border transition-all duration-200',
        active
          ? 'border-guardian/40 bg-guardian/10'
          : 'border-faint/30 bg-ash/40'
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full transition-all',
            active ? 'bg-guardian animate-safe-pulse' : 'bg-faint'
          )}
        />
        <span className="font-display font-semibold text-sm">
          {active ? 'Patrol Active' : 'Start Patrol'}
        </span>
      </div>
      <div
        className={cn(
          'w-10 h-6 rounded-full transition-all duration-300 flex items-center',
          active ? 'bg-guardian' : 'bg-faint/50'
        )}
      >
        <div
          className={cn(
            'w-4 h-4 rounded-full bg-cream shadow-md transition-transform duration-300 mx-1',
            active ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </div>
    </button>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card-surface p-3 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="font-mono font-bold text-lg" style={{ color }}>
        {value}
      </p>
      <p className="font-mono text-xs text-muted">{label}</p>
    </div>
  )
}

function GuardianRow({ guardian }) {
  const color = AURA_COLORS[guardian.aura_level || 'New']
  return (
    <div className="flex items-center justify-between py-2 border-b border-faint/20 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-guardian/20 flex items-center justify-center">
          <ShieldCheck size={12} className="text-guardian" />
        </div>
        <span className="font-body text-sm text-cream">
          {guardian.display_name || 'Guardian'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs" style={{ color }}>
          {guardian.aura_level}
        </span>
        <span className="font-mono text-xs text-muted">
          {Math.round(guardian.distance_m)}m
        </span>
      </div>
    </div>
  )
}

function AlertTriangleSmall() {
  return <AlertIcon />
}
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C44B38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}
