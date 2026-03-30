import { Bricolage_Grotesque, Outfit, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '../components/layout/Providers'

// --- Font Configuration ---
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  weight: ['300', '400', '500'],
  display: 'swap',
})

// --- Metadata ---
export const metadata = {
  title:       'SafeWalk — Walk Together',
  description: 'Community-powered women\'s safety. What if your entire neighbourhood walked with you?',
  manifest:    '/manifest.json',
  themeColor:  '#E8994A',
  viewport:    'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  appleWebApp: {
    capable:           true,
    statusBarStyle:    'black-translucent',
    title:             'SafeWalk',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title:       'SafeWalk — Walk Together',
    description: 'What if your entire neighbourhood walked with you?',
    type:        'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${outfit.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        {/* Mapbox GL CSS */}
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css"
          rel="stylesheet"
        />
        {/* PWA iOS meta */}
        <meta name="apple-mobile-web-app-capable"            content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style"   content="black-translucent" />
        <meta name="mobile-web-app-capable"                  content="yes" />
        <meta name="msapplication-TileColor"                 content="#E8994A" />
      </head>
      <body className="bg-void text-cream font-body antialiased overscroll-none">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
