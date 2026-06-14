'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import SystemPanel from '@/components/ui/SystemPanel'
import SkillRadar from '@/components/skills/SkillRadar'
import SubStatList from '@/components/skills/SubStatList'
import SubStatRadar from '@/components/skills/SubStatRadar'
import { getStatColor, getStatLabel, getStatDescription } from '@/lib/gameLogic'

export default function SkillsPage() {
  const player = useGameStore(s => s.player)
  const statConfig = useGameStore(s => s.statConfig)
  const [selectedStat, setSelectedStat] = useState<string | null>(null)

  if (!player) return null

  const statKeys = statConfig.map(c => c.key).filter(k => !!player.stats[k])
  const totalSubStats = statKeys.reduce(
    (acc, k) => acc + (player.stats[k]?.subStats.length ?? 0),
    0
  )

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="mb-2">
        <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase">
          Skill System
        </p>
        <h1 className="font-orbitron text-lg font-bold text-[#93c5fd]">
          Skill Web
        </h1>
      </div>

      {/* Main two-column layout */}
      <div className={selectedStat ? 'hidden' : 'grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4'}>
        {/* Left: Radar chart */}
        <SystemPanel title="Skill Radar" delay={0}>
          <div className="p-4">
            <SkillRadar player={player} statConfig={statConfig} />
            <div className="mt-3 flex items-center justify-center gap-4">
              <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">
                {totalSubStats} skills tracked
              </span>
              <span className="text-[#1e3a8a]">|</span>
              <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">
                Proportional Scale
              </span>
            </div>
          </div>
        </SystemPanel>

        {/* Right: Stat cards */}
        <SystemPanel title="Stats" delay={0.1}>
          <div className="p-3 space-y-2">
            {statKeys.map(stat => {
              const block = player.stats[stat]
              if (!block) return null
              const color = getStatColor(stat, statConfig)
              const isSelected = selectedStat === stat
              return (
                <button
                  key={stat}
                  onClick={() => setSelectedStat(isSelected ? null : stat)}
                  className="w-full text-left p-3 border transition-all"
                  style={{
                    borderColor: isSelected ? color : '#1e3a8a',
                    backgroundColor: isSelected ? `${color}11` : 'transparent',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = `${color}88`
                      e.currentTarget.style.backgroundColor = `${color}08`
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#1e3a8a'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-orbitron text-base font-black" style={{ color }}>
                      {getStatLabel(stat, statConfig)}
                    </span>
                    <span className="font-orbitron text-base font-black ml-auto" style={{ color: '#93c5fd' }}>
                      {block.value}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#374151] italic mb-1.5 leading-snug">
                    {getStatDescription(stat, statConfig)}
                  </p>
                  <span
                    className="font-orbitron text-[9px] px-1.5 py-0.5"
                    style={{ border: `1px solid ${color}44`, borderRadius: '2px', color: '#64748b' }}
                  >
                    {block.subStats.length} skills tracked
                  </span>
                </button>
              )
            })}
          </div>
        </SystemPanel>
      </div>

      {/* Drill-down panel */}
      <AnimatePresence>
        {selectedStat && (
          <DrillDownPanel
            stat={selectedStat}
            player={player}
            statConfig={statConfig}
            onBack={() => setSelectedStat(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

interface DrillDownProps {
  stat: string
  player: NonNullable<ReturnType<typeof useGameStore.getState>['player']>
  statConfig: import('@/lib/types').StatConfig[]
  onBack: () => void
}

function DrillDownPanel({ stat, player, statConfig, onBack }: DrillDownProps) {
  const color = getStatColor(stat, statConfig)
  const block = player.stats[stat]
  if (!block) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
    >
      <SystemPanel title={`${getStatLabel(stat, statConfig)}`} headerColor={color} delay={0}>
        <div className="p-4 space-y-4">
          {/* Back button */}
          <button
            onClick={onBack}
            className="font-orbitron text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all"
            style={{ color: '#64748b' }}
            onMouseEnter={e => (e.currentTarget.style.color = color)}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            BACK TO OVERVIEW
          </button>

          {/* Stat header */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-orbitron text-2xl font-black" style={{ color }}>
                {getStatLabel(stat, statConfig)}
              </span>
              <span className="font-orbitron text-xl font-black ml-auto" style={{ color: '#93c5fd' }}>
                {block.value}
              </span>
            </div>
            <p className="text-[11px] text-[#64748b] italic leading-relaxed">
              {getStatDescription(stat, statConfig)}
            </p>
          </div>

          {/* SubStat radar / bar chart */}
          <div
            className="border"
            style={{ borderColor: `${color}22`, borderRadius: '2px', backgroundColor: `${color}05` }}
          >
            <div className="px-3 pt-2 pb-1">
              <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">
                Skill Web
              </span>
            </div>
            <SubStatRadar subStats={block.subStats} color={color} />
          </div>

          {/* SubStatList in always-expanded mode */}
          <SubStatList stat={stat} statConfig={statConfig} alwaysExpanded={true} />
        </div>
      </SystemPanel>
    </motion.div>
  )
}
