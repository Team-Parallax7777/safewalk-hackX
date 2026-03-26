'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(null)
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  // Load session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadProfile(data.session.user.id)
      else              setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      if (sess) loadProfile(sess.user.id)
      else      setProfile(null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Load/create profile
  const loadProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist yet — create it
      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: userId })
        .select()
        .single()
      setProfile(created)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }, [])

  // Anonymous sign-in (no account required to report)
  const signInAnonymously = useCallback(async () => {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    return data
  }, [])

  // OTP sign-in for Guardians
  const sendOTP = useCallback(async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) throw error
  }, [])

  const verifyOTP = useCallback(async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  // Toggle guardian patrol mode
  const togglePatrol = useCallback(async (active) => {
    if (!session) return
    await supabase
      .from('profiles')
      .update({ patrol_active: active })
      .eq('id', session.user.id)
    setProfile((p) => ({ ...p, patrol_active: active }))
  }, [session])

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      isGuardian:      profile?.role === 'guardian' || profile?.is_guardian,
      isAuthenticated: !!session && !session.user.is_anonymous,
      signInAnonymously,
      sendOTP,
      verifyOTP,
      signOut,
      togglePatrol,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
