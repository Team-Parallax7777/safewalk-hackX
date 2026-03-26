// SafeWalk Service Worker v1
// Handles PWA caching, offline fallback, and background sync

const CACHE_NAME = 'safewalk-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install: pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin (Mapbox tiles, Supabase)
  if (request.method !== 'GET') return
  if (!url.origin.includes(self.location.origin)) return

  // API routes: network-only (real-time safety data must be fresh)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      )
    )
    return
  }

  // Pages & assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          // Offline fallback for navigation
          if (request.mode === 'navigate') {
            return caches.match('/offline') || caches.match('/')
          }
        })

      return cached || fetchPromise
    })
  )
})

// Push notifications for Guardian nudges
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const options = {
    body: data.body || 'Someone nearby marked a location as unsafe.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: data.url || '/dashboard' },
    actions: [
      { action: 'acknowledge', title: '👀 I am nearby' },
      { action: 'dismiss',     title:  'Dismiss' },
    ],
    tag: 'guardian-nudge',
    requireInteraction: true,
  }
  event.waitUntil(
    self.registration.showNotification(
      data.title || '⚠️ SafeWalk Nudge',
      options
    )
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'acknowledge') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data.url || '/dashboard')
    )
  }
})
