'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatKey } from '@/lib/types'
import { useGameStore } from '@/lib/store'
import { getStatColor, getStatLabel } from '@/lib/gameLogic'
import AddSubStatForm from './AddSubStatForm'

interface SubStatListProps {
  stat: StatKey
}

export default function SubStatList({ stat }: SubStatListProps) {
  const player = useGameStore(s => s.player)
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)

  if (!player) return null

  const block = player.stats[stat]
  const color = getStatColor(stat)

  return (
    <div
      className="border"
      style={{
        borderColor: expanded ? `${color}44` : '#1e3a8a',
        borderRadius: '2px',
        backgroundColor: expanded ? `${color}06` : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(s => !s)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className="font-orbitron text-sm font-bold"
            style={{ color }}
          >
            {stat}
          </span>
          <span className="text-[11px] text-[#64748b]">{getStatLabel(stat)}</span>
          <span
            className="font-orbitron text-[9px] px-1.5 py-0.5"
            style={{
              border: `1px solid ${color}44`,
              borderRadius: '2px',
              color: '#64748b',
            }}
          >
            {block.subStats.length} skills
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-orbitron text-base font-black" style={{ color: '#93c5fd' }}>
            {block.value}
          </span>
          <span className="text-[#64748b] text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Sub-stats list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-3 pb-3 space-y-2 border-t border-[#1e3a8a]">
              <div className="pt-2 space-y-2">
                {block.subStats.length === 0 ? (
                  <p className="text-[11px] text-[#374151] italic py-1">
                    No skills assigned. Add one below.
                  </p>
                ) : (
                  block.subStats
                    .slice()
                    .sort((a, b) => b.value - a.value)
                    .map(ss => (
                      <div key={ss.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#94a3b8]">{ss.name}</span>
                          <span className="font-orbitron text-[10px] text-[#93c5fd]">
                            {ss.value}<span className="text-[#374151]">/100</span>
                          </span>
                        </div>
                        <div className="h-[3px]" style={{ backgroundColor: '#1e3a8a', borderRadius: '2px' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${ss.value}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>

              {adding ? (
                <div className="pt-1">
                  <AddSubStatForm
                    defaultStat={stat}
                    onClose={() => setAdding(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="w-full py-1.5 font-orbitron text-[9px] uppercase tracking-wider transition-all"
                  style={{
                    border: `1px dashed ${color}33`,
                    borderRadius: '2px',
                    color: `${color}66`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${color}88`
                    e.currentTarget.style.color = color
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${color}33`
                    e.currentTarget.style.color = `${color}66`
                  }}
                >
                  + Add Skill
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
