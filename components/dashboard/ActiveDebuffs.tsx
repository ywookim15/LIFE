'use client'

import { useGameStore } from '@/lib/store'
import SystemPanel from '@/components/ui/SystemPanel'
import DebuffCard from '@/components/ui/DebuffCard'

export default function ActiveDebuffs() {
  const player = useGameStore(s => s.player)
  const debuffs = player?.activeDebuffs ?? []

  if (debuffs.length === 0) return null

  return (
    <SystemPanel title="Active Debuffs" headerColor="#7f1d1d" delay={0.15}>
      <div className="p-3 space-y-2">
        {debuffs.map(d => (
          <DebuffCard key={d.id} debuff={d} allowClear />
        ))}
      </div>
    </SystemPanel>
  )
}
