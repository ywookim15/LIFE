'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import TierBadge from '@/components/ui/TierBadge'
import XPBar from '@/components/ui/XPBar'
import SystemPanel from '@/components/ui/SystemPanel'
import { getDaysActive, getTierColor } from '@/lib/gameLogic'

export default function CharacterCard() {
  const player = useGameStore(s => s.player)
  if (!player) return null

  const daysActive = getDaysActive(player.createdAt)
  const tierColor = getTierColor(player.tier)

  return (
    <SystemPanel title="Character Status" delay={0}>
      <div className="p-5 space-y-5">
        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          {/* Avatar placeholder */}
          <div
            className="w-16 h-16 flex items-center justify-center shrink-0 relative"
            style={{
              border: `2px solid ${tierColor}`,
              borderRadius: '2px',
              backgroundColor: `${tierColor}11`,
              boxShadow: `0 0 15px ${tierColor}44`,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: tierColor }}>
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {/* Tier indicator corner */}
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center"
              style={{
                backgroundColor: '#05070f',
                border: `1px solid ${tierColor}`,
                borderRadius: '2px',
              }}
            >
              <span className="font-orbitron text-[9px] font-bold" style={{ color: tierColor }}>
                {player.tier}
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-orbitron text-xl font-bold text-[#e2e8f0] truncate">
              {player.name}
            </h2>
            {player.title ? (
              <p className="font-orbitron text-[11px] italic truncate mt-0.5" style={{ color: '#93c5fd88' }}>
                {player.title}
              </p>
            ) : (
              <p className="text-[11px] italic text-[#374151] mt-0.5">No title equipped</p>
            )}
          </div>
        </div>

        {/* Tier + Level */}
        <div className="flex items-center gap-4">
          <TierBadge tier={player.tier} size="md" showLabel />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-orbitron text-[10px] text-[#64748b] tracking-widest uppercase">
                Level
              </span>
              <span
                className="font-orbitron text-2xl font-black"
                style={{ color: '#93c5fd', textShadow: '0 0 8px rgba(147,197,253,0.5)' }}
              >
                {player.level}
              </span>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <XPBar
          current={player.xp}
          max={player.xpToNext}
          level={player.level}
          animated
        />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <StatCell label="Total XP" value={player.totalXP.toLocaleString()} color="#fbbf24" />
          <StatCell label="Days Active" value={daysActive.toString()} color="#93c5fd" />
          <StatCell label="Debuffs" value={player.activeDebuffs.length.toString()} color={player.activeDebuffs.length > 0 ? '#ef4444' : '#4fffb0'} />
        </div>
      </div>
    </SystemPanel>
  )
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="text-center p-2 border"
      style={{
        borderColor: '#1e3a8a',
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        borderRadius: '2px',
      }}
    >
      <p className="font-orbitron text-xs font-bold" style={{ color }}>{value}</p>
      <p className="font-orbitron text-[8px] text-[#64748b] tracking-wider uppercase mt-0.5">{label}</p>
    </div>
  )
}
