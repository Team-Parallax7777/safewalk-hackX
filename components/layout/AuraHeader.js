'use client'

import { useState }    from 'react'
import { Shield, Map, Bell, Menu, X, Flame } from 'lucide-react'
import { useAuth }     from '@/lib/context/AuthContext'
import { useSafety }   from '@/lib/context/SafetyContext'
import { useMap }      from '@/lib/context/MapContext'
import { cn }          from '@/lib/utils'

const AURA_CONFIG = {
  New:       { color: '#8A7D70', icon: '○', glow: 'rgba(138,125,112,0.3)' },
  Trusted:   { color: '#E8994A', icon: '◑', glow: 'rgba(232,153,74,0.35)' },
  High:      { color: '#E8994A', icon: '◕', glow: 'rgba(232,153,74,0.45)' },
  'Very High':{ color: '#F0B070', icon: '●', glow: 'rgba(240,176,112,0.55)' },
  Elite:     { color: '#FFD700', icon: '★', glow: 'rgba(255,215,0,0.65)' },
}

export default function AuraHeader({ onMenuOpen }) {
  const { profile, isGuardian, togglePatrol } = useAuth()
  const { nearbyGuardians, walkActive }        = useSafety()
  const { flyToUser }                          = useMap()

  const auraLevel  = profile?.aura_level || 'New'
  const auraCfg    = AURA_CONFIG[auraLevel] || AURA_CONFIG.New
  const patrolOn   = profile?.patrol_active || false

  return (
    <header className="aura-header fixed top-0 left-0 right-0 z-40 pt-safe">
      <div className="flex items-center justify-between px-4 py-3">

        {/* Left: Brand mark */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #E8994A 0%, #C47830 100%)',
              boxShadow: `0 0 16px ${auraCfg.glow}`,
            }}
          >
            <Shield size={16} className="text-void" strokeWidth={2.5} />
          </div>
          <span
            className="font-display font-bold text-lg tracking-tight"
            style={{ color: '#F5EDD8' }}
          >
            Safe<span style={{ color: '#E8994A' }}>Walk</span>
          </span>
        </div>

        {/* Center: Aura badge */}
        <button
          onClick={flyToUser}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full haptic-tap"
          style={{
            background: `${auraCfg.color}18`,
            border:     `1px solid ${auraCfg.color}40`,
          }}
          aria-label={`Aura level: ${auraLevel}. Tap to center map.`}
        >
          <Flame
            size={14}
            style={{ color: auraCfg.color }}
            className={auraLevel === 'Elite' ? 'animate-amber-glow' : ''}
          />
          <span
            className="font-mono text-xs font-medium"
            style={{ color: auraCfg.color }}
          >
            {auraLevel === 'New' ? 'New Walker' : `Aura: ${auraLevel}`}
          </span>
        </button>

        {/* Right: Status indicators + menu */}
        <div className="flex items-center gap-2">

          {/* Nearby guardians badge */}
          {nearbyGuardians.length > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{
                background: 'rgba(91,143,168,0.15)',
                border:     '1px solid rgba(91,143,168,0.3)',
              }}
              title={`${nearbyGuardians.length} guardian${nearbyGuardians.length > 1 ? 's' : ''} nearby`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-guardian animate-safe-pulse" />
              <span className="font-mono text-xs text-guardian">{nearbyGuardians.length}</span>
            </div>
          )}

          {/* Walk active indicator */}
          {walkActive && (
            <div
              className="w-2 h-2 rounded-full animate-safe-pulse"
              style={{ background: '#4A9E6B' }}
              title="Walk in progress"
            />
          )}

          {/* Guardian patrol toggle (guardians only) */}
          {isGuardian && (
            <button
              onClick={() => togglePatrol(!patrolOn)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg font-mono text-xs font-medium haptic-tap transition-all',
                patrolOn
                  ? 'bg-guardian/20 text-guardian border border-guardian/40 animate-guardian-arrive'
                  : 'bg-faint/30 text-muted border border-faint/30'
              )}
            >
              {patrolOn ? '👁 ON' : '👁 OFF'}
            </button>
          )}

          <button
            onClick={onMenuOpen}
            className="w-9 h-9 rounded-xl bg-ash/60 flex items-center justify-center haptic-tap"
            aria-label="Open menu"
          >
            <Menu size={18} className="text-cream" />
          </button>
        </div>
      </div>

      {/* Safety filter chips */}
      <FilterChips />
    </header>
  )
}

function FilterChips() {
  const [active, setActive] = useState('all')
  const chips = [
    { id: 'all',      label: 'All Zones'  },
    { id: 'unsafe',   label: '⚠️ Unsafe'  },
    { id: 'guardians',label: '🛡 Guardians'},
    { id: 'heat',     label: '🔥 Heat Map' },
  ]

  return (
    <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => setActive(chip.id)}
          className={cn(
            'flex-shrink-0 px-3 py-1 rounded-full text-xs font-body font-medium haptic-tap transition-all',
            active === chip.id
              ? 'text-void'
              : 'bg-ash/50 text-muted border border-faint/30'
          )}
          style={
            active === chip.id
              ? {
                  background:   'linear-gradient(135deg, #E8994A, #C47830)',
                  boxShadow:    '0 0 12px rgba(232,153,74,0.4)',
                }
              : {}
          }
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
