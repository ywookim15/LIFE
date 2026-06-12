import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'LifeGame — System Online',
  description: 'A gamified self-improvement system. Real life. Real growth. System evaluated.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen" style={{ backgroundColor: '#05070f' }}>
        <Providers>
          <Navigation />
          {/* Desktop: offset for sidebar. Mobile: offset for bottom bar */}
          <main className="md:ml-[220px] pb-[60px] md:pb-0 min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
