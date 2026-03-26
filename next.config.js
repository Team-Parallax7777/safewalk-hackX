/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Mapbox worker scripts
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Silence Mapbox GL's canvas warning in SSR
      canvas: false,
    }
    return config
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY'    },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },

  // Images from Mapbox CDN
  images: {
    domains: ['api.mapbox.com'],
  },
}

module.exports = nextConfig
