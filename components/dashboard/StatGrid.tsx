'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import SystemPanel from '@/components/ui/SystemPanel'
import { ALL_STAT_KEYS, getStatColor, getStatLabel } from '@/lib/gameLogic'
import { StatKey } from '@/lib/types'

export default function StatGrid() {
  const player = useGameStore(s => s.player)
  if (!player) return null

  return (
    <SystemPanel title="Core Statistics" delay={0.1}>
      <div
        className="grid grid-cols-2 md:grid-cols-5 gap-px"
        style={{ background: '#1e3a8a' }}
      >
        {ALL_STAT_KEYS.map((stat, i) => (
          <StatBlock key={stat} stat={stat} block={player.stats[stat]} index={i} total={ALL_STAT_KEYS.length} />
        ))}
      </div>
    </SystemPanel>
  )
}

function StatBlock({ stat, block, index, total }: { stat: StatKey; block: { value: number; subStats: any[] }; index: number; total: number }) {
  const color = getStatColor(stat)
  const topSubStats = [...block.subStats].sort((a, b) => b.value - a.value).slice(0, 3)
  // On mobile (2-col), last item spans full row if total is odd
  const spanClass = index === total - 1 && total % 2 !== 0 ? 'col-span-2 md:col-span-1' : ''

  return (
    <motion.div
      className={`p-3 space-y-2 ${spanClass}`}
      style={{ background: 'var(--bg-void)' }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
    >
      {/* Stat header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-orbitron text-sm font-bold" style={{ color }}>{stat}</p>
          <p className="text-[9px] text-[#64748b] uppercase tracking-wider">{getStatLabel(stat)}</p>
        </div>
        <p
          className="font-orbitron text-2xl font-black text-[#93c5fd]"
          style={{ lineHeight: 1 }}
        >
          {block.value}
        </p>
      </div>

      {/* Sub-stats */}
      <div className="space-y-1">
        {topSubStats.length > 0 ? (
          topSubStats.map(ss => (
            <div key={ss.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] text-[#94a3b8] truncate">{ss.name}</span>
                  <span className="text-[9px] font-orbitron text-[#93c5fd] ml-1">{ss.value}</span>
                </div>
                <div className="h-[2px] bg-[#1e3a8a] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${ss.value}%` }}
                    transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[9px] text-[#374151] italic">No sub-stats assigned</p>
        )}
        {block.subStats.length > 3 && (
          <p className="text-[9px] text-[#64748b]">+{block.subStats.length - 3} more</p>
        )}
      </div>
    </motion.div>
  )
}
