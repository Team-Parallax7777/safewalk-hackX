'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { AuthProvider } from '../../../lib/context/AuthContext'
import { MapProvider } from '../../../lib/context/MapContext'
import { SafetyProvider } from '../../../lib/context/SafetyContext'

export function Providers({ children }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30000,
          gcTime: 300000,
          retry: 3,
        },
      },
    })
  )

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
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
