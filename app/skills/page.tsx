'use client'

import { useGameStore } from '@/lib/store'
import SystemPanel from '@/components/ui/SystemPanel'
import SkillRadar from '@/components/skills/SkillRadar'
import SubStatList from '@/components/skills/SubStatList'
import { ALL_STAT_KEYS } from '@/lib/gameLogic'

export default function SkillsPage() {
  const player = useGameStore(s => s.player)
  if (!player) return null

  const totalSubStats = ALL_STAT_KEYS.reduce(
    (acc, k) => acc + player.stats[k].subStats.length,
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        {/* Radar chart */}
        <SystemPanel title="Skill Radar" delay={0}>
          <div className="p-4">
            <SkillRadar player={player} />
            <div className="mt-3 flex items-center justify-center gap-4">
              <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">
                {totalSubStats} skills tracked
              </span>
              <span className="text-[#1e3a8a]">|</span>
              <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">
                Scale: 0 — 100
              </span>
            </div>
          </div>
        </SystemPanel>

        {/* Sub-stat panels */}
        <SystemPanel title="Stat Details" delay={0.1}>
          <div className="p-3 space-y-2">
            {ALL_STAT_KEYS.map(stat => (
              <SubStatList key={stat} stat={stat} />
            ))}
          </div>
        </SystemPanel>
      </div>
    </div>
  )
}
