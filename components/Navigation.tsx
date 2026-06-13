'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useGameStore } from '@/lib/store'
import TierBadge from '@/components/ui/TierBadge'

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Status',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/quests',
    label: 'Quests',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    href: '/skills',
    label: 'Skills',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
  },
  {
    href: '/character',
    label: 'Character',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <path d="M16 3.5c1.5.5 2.5 2 2.5 3.5" />
        <path d="M17 12.5c2 1 3 3 3 5" />
      </svg>
    ),
  },
  {
    href: '/body',
    label: 'Body',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="4" r="2" />
        <path d="M12 6v6" />
        <path d="M8 9l4 3 4-3" />
        <path d="M10 12v6l-2 3" />
        <path d="M14 12v6l2 3" />
      </svg>
    ),
  },
  {
    href: '/log',
    label: 'Log',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6h16M4 10h16M4 14h10M4 18h6" />
        <circle cx="19" cy="17" r="3" />
        <path d="M21 19l2 2" />
      </svg>
    ),
  },
  {
    href: '/party',
    label: 'Party',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 20v-2a6 6 0 016-6" />
        <circle cx="17" cy="8" r="2.5" />
        <path d="M20 20v-1.5a5 5 0 00-5-5" />
      </svg>
    ),
  },
  {
    href: '/achievements',
    label: 'Achievements',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

export default function Navigation() {
  const pathname = usePathname()
  const player = useGameStore(s => s.player)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[220px] panel border-r border-[#1e3a8a] z-50"
        style={{ borderRadius: 0 }}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-[#1e3a8a]">
          <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase mb-1">
            System v1.0
          </p>
          <h1 className="font-orbitron text-lg font-bold text-[#93c5fd] text-glow-blue tracking-wider">
            LifeGame
          </h1>
        </div>

        {/* Player summary */}
        {player && (
          <div className="px-4 py-3 border-b border-[#1e3a8a] flex items-center gap-3">
            <TierBadge tier={player.tier} size="sm" />
            <div className="min-w-0">
              <p className="font-orbitron text-xs text-[#e2e8f0] truncate">{player.name}</p>
              {player.title && (
                <p className="text-[10px] text-[#64748b] italic truncate">{player.title}</p>
              )}
            </div>
          </div>
        )}

        {/* Nav links */}
        <div className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 transition-all duration-150 group"
                style={{
                  backgroundColor: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                  borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
                  color: active ? '#93c5fd' : '#64748b',
                }}
              >
                <span className={`transition-colors ${active ? 'text-[#3b82f6]' : 'text-[#64748b] group-hover:text-[#93c5fd]'}`}>
                  {item.icon}
                </span>
                <span className={`font-orbitron text-[11px] tracking-wider uppercase transition-colors ${active ? 'text-[#93c5fd]' : 'text-[#64748b] group-hover:text-[#93c5fd]'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1e3a8a]">
          <p className="font-orbitron text-[9px] text-[#374151] tracking-wider">
            ANTHROPIC SYSTEM
          </p>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 panel border-t border-[#1e3a8a] flex"
        style={{ borderRadius: 0, height: 60 }}
      >
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
              style={{ color: active ? '#3b82f6' : '#64748b', minWidth: 0 }}
            >
              <span style={{ color: active ? '#3b82f6' : '#64748b' }}>{item.icon}</span>
              <span
                className="font-orbitron text-[7px] tracking-wider uppercase hidden xs:block"
                style={{ color: active ? '#93c5fd' : '#64748b' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
