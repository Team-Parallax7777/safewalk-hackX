'use client'

import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef
} from 'react'
import { supabase }   from '@/lib/supabase/client'
import { useAuth }    from './AuthContext'
import { useMap }     from './MapContext'

const SafetyContext = createContext(null)

// How long a report is considered "active" (ms)
const REPORT_TTL_MS = 30 * 60 * 1000  // 30 minutes

export function SafetyProvider({ children }) {
  const { session, signInAnonymously } = useAuth()
  const { userLocation }               = useMap()

  const [reports,          setReports]          = useState([])
  const [guardianLocations,setGuardianLocations] = useState([])
  const [walkActive,       setWalkActive]        = useState(false)
  const [sosActive,        setSosActive]         = useState(false)
  const [nearbyGuardians,  setNearbyGuardians]   = useState([])
  const [lastReportId,     setLastReportId]      = useState(null)

  // Retry logic for Supabase reconnect
  const retryTimerRef = useRef(null)
  const channelRef    = useRef(null)

  // ── Fetch recent active reports ──────────────────────────
  const fetchReports = useCallback(async () => {
    const since = new Date(Date.now() - REPORT_TTL_MS).toISOString()
    const { data, error } = await supabase
      .from('reports')
      .select('id, latitude, longitude, severity, created_at')
      .eq('is_resolved', false)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) setReports(data)
  }, [])

  // ── Fetch active guardian positions ──────────────────────
  const fetchGuardians = useCallback(async () => {
    const { data, error } = await supabase
      .from('guardian_locations')
      .select(`
        guardian_id, latitude, longitude, heading, updated_at,
        profiles!inner(display_name, aura_level, patrol_active)
      `)
      .eq('profiles.patrol_active', true)

    if (!error && data) setGuardianLocations(data)
  }, [])

  // ── Real-time subscription ────────────────────────────────
  const subscribeRealtime = useCallback(() => {
    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('safewalk-realtime')
      // New reports → add marker instantly
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          setReports((prev) => [payload.new, ...prev].slice(0, 200))
        }
      )
      // Reports resolved → remove marker
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports' },
        (payload) => {
          if (payload.new.is_resolved) {
            setReports((prev) => prev.filter((r) => r.id !== payload.new.id))
          }
        }
      )
      // Guardian location updates
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guardian_locations' },
        () => fetchGuardians()
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // Exponential back-off retry
          retryTimerRef.current = setTimeout(() => subscribeRealtime(), 5_000)
        }
      })

    channelRef.current = channel
  }, [fetchGuardians])

  // ── Bootstrap ─────────────────────────────────────────────
  useEffect(() => {
    fetchReports()
    fetchGuardians()
    subscribeRealtime()

    return () => {
      if (channelRef.current)  supabase.removeChannel(channelRef.current)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [fetchReports, fetchGuardians, subscribeRealtime])

  // ── Find nearby guardians whenever user moves ─────────────
  useEffect(() => {
    if (!userLocation) return
    const { lat, lng } = userLocation

    supabase
      .rpc('find_nearby_guardians', { lat, lon: lng, radius: 1000 })
      .then(({ data }) => {
        if (data) setNearbyGuardians(data)
      })
  }, [userLocation])

  // ── File an "Unsafe" report ───────────────────────────────
  const fileReport = useCallback(async (severity = 'moderate', description = null) => {
    if (!userLocation) throw new Error('Location not available')

    // Ensure user is signed in (anonymous OK)
    let userId = session?.user?.id
    if (!userId) {
      const { session: anonSess } = await signInAnonymously()
      userId = anonSess?.user?.id
    }

    const { lat, lng } = userLocation
    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id:     userId || null,
        latitude:    lat,
        longitude:   lng,
        location:    `POINT(${lng} ${lat})`,
        severity,
        description,
        is_resolved: false,
      })
      .select()
      .single()

    if (error) throw error
    setLastReportId(data.id)
    return data
  }, [userLocation, session, signInAnonymously])

  // ── Start Walk ────────────────────────────────────────────
  const startWalk = useCallback(() => {
    setWalkActive(true)
    setSosActive(false)
  }, [])

  const endWalk = useCallback(() => {
    setWalkActive(false)
    setSosActive(false)
  }, [])

  // ── SOS ───────────────────────────────────────────────────
  const triggerSOS = useCallback(async () => {
    setSosActive(true)
    const report = await fileReport('sos')
    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 600])
    return report
  }, [fileReport])

  return (
    <SafetyContext.Provider value={{
      reports,
      guardianLocations,
      nearbyGuardians,
      walkActive,
      sosActive,
      lastReportId,
      fileReport,
      startWalk,
      endWalk,
      triggerSOS,
      refreshReports: fetchReports,
    }}>
      {children}
    </SafetyContext.Provider>
  )
}

export const useSafety = () => {
  const ctx = useContext(SafetyContext)
  if (!ctx) throw new Error('useSafety must be used within SafetyProvider')
  return ctx
}
