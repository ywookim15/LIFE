'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import TierBadge from '@/components/ui/TierBadge'
import XPBar from '@/components/ui/XPBar'
import SystemPanel from '@/components/ui/SystemPanel'
import { getDaysActive, getTierColor, TIER_ORDER } from '@/lib/gameLogic'
import { Tier } from '@/lib/types'

// Absolute level at which each tier starts (levels are continuous 1–900+)
const TIER_STARTS: Record<Tier, number> = {
  F: 1, E: 101, D: 201, C: 301, B: 401, A: 501, S: 601, 'S+': 701, X: 801,
}

// Pre-built tier section data for the popup number line
function buildTierSections(currentTier: Tier, currentLevel: number) {
  // After prestige (tier X with level 1-100), the X section shows levels 1+
  const isPostPrestige = currentTier === 'X' && currentLevel <= 100

  return TIER_ORDER.map(tier => {
    let startLvl: number
    let endLvl: number

    if (tier === 'X' && isPostPrestige) {
      startLvl = 1
      endLvl = Math.max(100, currentLevel + 20)
    } else {
      startLvl = TIER_STARTS[tier]
      endLvl = tier === 'X' ? Math.max(900, currentLevel + 20) : startLvl + 99
    }

    const levels = Array.from({ length: endLvl - startLvl + 1 }, (_, i) => {
      const lvl = startLvl + i
      return { level: lvl, xpNeeded: 100, isCurrent: tier === currentTier && lvl === currentLevel }
    })
    return { tier, color: getTierColor(tier), levels }
  })
}

function TierProgressPopup({ onClose }: { onClose: () => void }) {
  const player = useGameStore(s => s.player)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll current level into view after render
    const el = document.getElementById('tier-current-node')
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [])

  if (!player) return null

  const sections = buildTierSections(player.tier, player.level)
  const currentTierColor = getTierColor(player.tier)

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(5,7,15,0.88)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-2xl flex flex-col gap-3"
        style={{
          background: '#0d1420',
          border: `1px solid ${currentTierColor}55`,
          borderRadius: '4px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: `0 0 30px ${currentTierColor}33`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e3a8a]">
          <div>
            <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">Tier Progression Path</p>
            <p className="font-orbitron text-base font-bold" style={{ color: currentTierColor }}>
              {player.tier} Tier · Level {player.level}
            </p>
          </div>
          <button onClick={onClose} className="font-orbitron text-xs text-[#374151] hover:text-[#64748b] px-2 py-1"
            style={{ border: '1px solid #1e3a8a', borderRadius: '2px', background: 'transparent', cursor: 'pointer' }}>
            ✕ Close
          </button>
        </div>

        {/* XP summary */}
        <div className="flex gap-4 px-4">
          {[
            { label: 'Current XP', value: player.xp.toLocaleString(), color: '#fbbf24' },
            { label: 'XP to Next', value: player.xpToNext.toLocaleString(), color: currentTierColor },
            { label: 'Total XP', value: player.totalXP.toLocaleString(), color: '#4fffb0' },
          ].map(item => (
            <div key={item.label} className="flex-1 p-2 text-center" style={{ background: 'rgba(30,58,138,0.15)', borderRadius: '2px', border: '1px solid #1e3a8a' }}>
              <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider">{item.label}</p>
              <p className="font-orbitron text-sm font-bold mt-0.5" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Horizontal scrollable tier sections */}
        <div className="px-4 pb-4 flex-1 overflow-hidden">
          <p className="font-orbitron text-[7px] text-[#374151] uppercase tracking-widest mb-2">
            Drag to scroll · F → X tier · 100 levels per tier · levels continue at X
          </p>
          <div
            ref={containerRef}
            className="overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e3a8a transparent' }}
          >
            <div className="flex gap-0 min-w-max items-start">
              {sections.map(({ tier, color, levels }) => (
                <div key={tier} className="flex flex-col items-start">
                  {/* Tier header */}
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 mb-2 sticky left-0"
                    style={{
                      background: `${color}22`,
                      border: `1px solid ${color}55`,
                      borderRadius: '2px',
                      minWidth: levels.length * 28,
                    }}
                  >
                    <span className="font-orbitron text-[10px] font-bold" style={{ color }}>{tier}</span>
                    <span className="font-orbitron text-[7px] text-[#475569]">Tier</span>
                  </div>

                  {/* Level nodes row */}
                  <div className="flex gap-0.5 items-end mb-1">
                    {levels.map(({ level, xpNeeded, isCurrent }) => {
                      const tierIdx = TIER_ORDER.indexOf(tier)
                      const playerTierIdx = TIER_ORDER.indexOf(player.tier)
                      const isPast = tierIdx < playerTierIdx ||
                        (tierIdx === playerTierIdx && level < player.level)

                      return (
                        <div
                          key={level}
                          id={isCurrent ? 'tier-current-node' : undefined}
                          className="flex flex-col items-center"
                          style={{ width: 27 }}
                        >
                          {/* Node */}
                          <div
                            className="w-6 h-6 flex items-center justify-center font-orbitron font-bold transition-all"
                            style={{
                              fontSize: isCurrent ? '8px' : '7px',
                              borderRadius: '2px',
                              border: `1px solid ${isCurrent ? color : isPast ? `${color}44` : '#1e3a8a'}`,
                              backgroundColor: isCurrent ? `${color}44` : isPast ? `${color}18` : 'transparent',
                              color: isCurrent ? color : isPast ? `${color}99` : '#1e3a8a',
                              boxShadow: isCurrent ? `0 0 10px ${color}88, 0 0 20px ${color}44` : 'none',
                              transform: isCurrent ? 'scale(1.25)' : 'scale(1)',
                              position: 'relative',
                              zIndex: isCurrent ? 2 : 1,
                            }}
                          >
                            {level}
                          </div>
                          {/* XP label — every 10 or current */}
                          <div style={{ height: 16 }} className="flex items-start justify-center mt-0.5">
                            {(level % 10 === 0 || isCurrent || level === 1) && (
                              <p className="font-orbitron text-center leading-none"
                                style={{ fontSize: '6px', color: isCurrent ? color : '#374151', whiteSpace: 'nowrap' }}>
                                {xpNeeded >= 1000 ? `${(xpNeeded / 1000).toFixed(1)}k` : xpNeeded}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Colored bar under this tier's levels */}
                  <div style={{
                    height: 3,
                    width: levels.length * 27 + (levels.length - 1) * 2,
                    background: `linear-gradient(to right, ${color}88, ${color}22)`,
                    borderRadius: '2px',
                    marginLeft: 0,
                  }} />
                </div>
              ))}
              {/* Infinity marker past X tier */}
              <div className="flex flex-col items-center justify-start pl-3 pt-7">
                <div className="font-orbitron text-lg font-black text-[#374151]">∞</div>
                <p className="font-orbitron text-[6px] text-[#374151]">X Tier</p>
                <p className="font-orbitron text-[6px] text-[#374151]">∞ levels</p>
              </div>
            </div>
          </div>
          <p className="font-orbitron text-[7px] text-[#374151] mt-1">
            XP shown below each node = XP required to advance that level. Highlighted = your current position.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function CharacterCard() {
  const player = useGameStore(s => s.player)
  const [showPopup, setShowPopup] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!player) return null

  const daysActive = getDaysActive(player.createdAt)
  const tierColor = getTierColor(player.tier)

  return (
    <SystemPanel title="Character Status" delay={0}>
      <div className="p-5 space-y-5">
        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPopup(true)}
            className="w-16 h-16 flex items-center justify-center shrink-0 relative transition-all hover:scale-105"
            title="View tier progression path"
            style={{
              border: `2px solid ${tierColor}`,
              borderRadius: '2px',
              backgroundColor: `${tierColor}11`,
              boxShadow: `0 0 15px ${tierColor}44`,
              cursor: 'pointer',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: tierColor }}>
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-void)', border: `1px solid ${tierColor}`, borderRadius: '2px' }}
            >
              <span className="font-orbitron text-[9px] font-bold" style={{ color: tierColor }}>{player.tier}</span>
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="font-orbitron text-xl font-bold text-[#e2e8f0] truncate">{player.name}</h2>
            {player.title ? (
              <p className="font-orbitron text-[11px] italic truncate mt-0.5" style={{ color: '#93c5fd88' }}>{player.title}</p>
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
              <span className="font-orbitron text-[10px] text-[#64748b] tracking-widest uppercase">Level</span>
              <span className="font-orbitron text-2xl font-black" style={{ color: '#93c5fd', textShadow: '0 0 8px rgba(147,197,253,0.5)' }}>
                {player.level}
              </span>
            </div>
          </div>
        </div>

        <XPBar current={player.xp} max={player.xpToNext} level={player.level} animated />

        <div className="grid grid-cols-3 gap-2 pt-1">
          <StatCell label="Total XP" value={player.totalXP.toLocaleString()} color="#fbbf24" />
          <StatCell label="Days Active" value={daysActive.toString()} color="#93c5fd" />
          <StatCell label="History" value={`${(player.statHistory ?? []).length}d`} color="#93c5fd" />
        </div>
      </div>

      {/* Portal renders OUTSIDE SystemPanel to avoid stacking context issues */}
      {mounted && createPortal(
        <AnimatePresence>
          {showPopup && <TierProgressPopup onClose={() => setShowPopup(false)} />}
        </AnimatePresence>,
        document.body
      )}
    </SystemPanel>
  )
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-2 border"
      style={{ borderColor: '#1e3a8a', backgroundColor: 'rgba(30, 58, 138, 0.1)', borderRadius: '2px' }}>
      <p className="font-orbitron text-xs font-bold" style={{ color }}>{value}</p>
      <p className="font-orbitron text-[8px] text-[#64748b] tracking-wider uppercase mt-0.5">{label}</p>
    </div>
  )
}
