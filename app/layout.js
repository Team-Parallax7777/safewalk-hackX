import { Bricolage_Grotesque, Outfit, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '../components/layout/Providers'

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

export const metadata = {
  title: 'SafeWalk — Walk Together',
  description: 'Community-powered women\'s safety.',
  manifest: '/manifest.json',
  themeColor: '#E8994A',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${outfit.variable} ${ibmPlexMono.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-void text-cream font-body antialiased overscroll-none">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
