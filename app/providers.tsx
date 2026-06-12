'use client'

import { ReactNode, useEffect, useState } from 'react'
import { NotificationProvider } from '@/contexts/NotificationContext'
import SystemNotification from '@/components/ui/SystemNotification'
import LevelUpModal from '@/components/ui/LevelUpModal'
import { useGameStore } from '@/lib/store'
import OnboardingModal from '@/components/OnboardingModal'

function GameWrapper({ children }: { children: ReactNode }) {
  const player = useGameStore(s => s.player)
  const hasHydrated = useGameStore(s => s._hasHydrated)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !hasHydrated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#05070f' }}>
        <div className="text-center space-y-3">
          <div
            className="w-12 h-12 border-2 border-[#1e3a8a] border-t-[#3b82f6] rounded-full mx-auto animate-spin"
          />
          <p className="font-orbitron text-[10px] text-[#3b82f6] tracking-[0.4em] uppercase">
            Loading System...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {!player && <OnboardingModal />}
      {children}
      <LevelUpModal />
    </>
  )
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      <GameWrapper>{children}</GameWrapper>
      <SystemNotification />
    </NotificationProvider>
  )
}
