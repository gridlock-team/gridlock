import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GridLock',
  description: 'Sports squares pool app',
  manifest: '/manifest.json',
  other: {
    google: 'notranslate',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GridLock',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <body className="notranslate bg-slate-900 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
