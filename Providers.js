'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect }              from 'react'
import { AuthProvider }                     from '@/lib/context/AuthContext'
import { MapProvider }                      from '@/lib/context/MapContext'
import { SafetyProvider }                   from '@/lib/context/SafetyContext'

export function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:        30_000,   // 30s — safety data refreshed frequently
            gcTime:           300_000,  // 5min cache
            retry:            3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
          },
        },
      })
  )

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[SafeWalk SW] Registered', reg.scope))
        .catch((err) => console.error('[SafeWalk SW] Error:', err))
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MapProvider>
          <SafetyProvider>{children}</SafetyProvider>
        </MapProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
