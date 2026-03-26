// lib/supabase/client.js
// Browser-side Supabase client (singleton pattern)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[SafeWalk] Missing Supabase environment variables.\n' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  )
}

// Singleton: reuse across the app to avoid multiple WebSocket connections
let _client = null

export function getSupabaseClient() {
  if (_client) return _client

  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession:    true,
      autoRefreshToken:  true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  return _client
}

// Convenience export for direct use
export const supabase = getSupabaseClient()
