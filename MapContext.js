'use client'

import {
  createContext, useContext, useRef,
  useState, useCallback, useEffect
} from 'react'

const MapContext = createContext(null)

export function MapProvider({ children }) {
  const mapRef         = useRef(null)     // mapboxgl.Map instance
  const [mapReady,     setMapReady]     = useState(false)
  const [userLocation, setUserLocation] = useState(null)  // { lat, lng, heading }
  const [geoError,     setGeoError]     = useState(null)
  const watchIdRef     = useRef(null)

  // Start continuous geolocation watch
  const startLocationWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported on this device.')
      return
    }

    const success = (pos) => {
      const loc = {
        lat:      pos.coords.latitude,
        lng:      pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading:  pos.coords.heading,
      }
      setUserLocation(loc)
      setGeoError(null)
    }

    const error = (err) => {
      setGeoError(err.message)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      success,
      error,
      {
        enableHighAccuracy: true,
        maximumAge:         5_000,
        timeout:            10_000,
      }
    )
  }, [])

  const stopLocationWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  // Fly map to coordinates
  const flyTo = useCallback((lat, lng, zoom = 15) => {
    if (!mapRef.current || !mapReady) return
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom,
      speed: 1.4,
      curve: 1,
      essential: true,
    })
  }, [mapReady])

  // Fly to user's current position
  const flyToUser = useCallback(() => {
    if (userLocation) {
      flyTo(userLocation.lat, userLocation.lng, 16)
    }
  }, [userLocation, flyTo])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopLocationWatch()
  }, [stopLocationWatch])

  return (
    <MapContext.Provider value={{
      mapRef,
      mapReady,
      setMapReady,
      userLocation,
      geoError,
      startLocationWatch,
      stopLocationWatch,
      flyTo,
      flyToUser,
    }}>
      {children}
    </MapContext.Provider>
  )
}

export const useMap = () => {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error('useMap must be used within MapProvider')
  return ctx
}
