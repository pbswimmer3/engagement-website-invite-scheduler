import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Invite Sender — Aanya & Prad',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cream text-navy min-h-screen">{children}</body>
    </html>
  )
}
