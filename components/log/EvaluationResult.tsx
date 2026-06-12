'use client'

import { motion } from 'framer-motion'
import { DailyLog } from '@/lib/types'
import { getStatColor, formatTimestamp } from '@/lib/gameLogic'
import XPBar from '@/components/ui/XPBar'
import { useGameStore } from '@/lib/store'

interface EvaluationResultProps {
  log: DailyLog
}

export default function EvaluationResult({ log }: EvaluationResultProps) {
  const player = useGameStore(s => s.player)
  const eval_ = log.aiEvaluation
  if (!eval_ || !player) return null

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* System message */}
      <div
        className="p-4"
        style={{
          border: '1px solid #1e3a8a',
          borderRadius: '2px',
          backgroundColor: 'rgba(30, 58, 138, 0.08)',
        }}
      >
        <p className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest mb-2">
          System Message
        </p>
        <p
          className="font-orbitron text-sm text-[#93c5fd] leading-relaxed blink-cursor"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          {eval_.systemMessage}
        </p>
        <p className="text-[9px] text-[#374151] mt-2">{formatTimestamp(eval_.evaluatedAt)}</p>
      </div>

      {/* XP awarded */}
      <div
        className="p-4"
        style={{
          border: '1px solid #92400e',
          borderRadius: '2px',
          backgroundColor: 'rgba(251, 191, 36, 0.05)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest">
            XP Awarded
          </p>
          <motion.p
            className="font-orbitron text-2xl font-black"
            style={{ color: '#fbbf24', textShadow: '0 0 10px rgba(251,191,36,0.5)' }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            +{eval_.xpAwarded}
          </motion.p>
        </div>

        <XPBar
          current={player.xp}
          max={player.xpToNext}
          level={player.level}
          animated
        />

        {/* Stat breakdown */}
        {eval_.statBreakdown.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest mb-2">
              Stat Distribution
            </p>
            {eval_.statBreakdown
              .filter(sb => sb.xp > 0)
              .sort((a, b) => b.xp - a.xp)
              .map(sb => {
                const color = getStatColor(sb.stat)
                return (
                  <div key={sb.stat} className="flex items-center gap-3">
                    <span
                      className="font-orbitron text-[10px] font-bold w-8 shrink-0"
                      style={{ color }}
                    >
                      {sb.stat}
                    </span>
                    <div className="flex-1 h-[3px]" style={{ backgroundColor: '#1e3a8a', borderRadius: '2px' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(sb.xp / eval_.xpAwarded) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                      />
                    </div>
                    <span className="font-orbitron text-[10px] text-[#93c5fd] w-8 text-right shrink-0">
                      +{sb.xp}
                    </span>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Sub-stat updates */}
      {eval_.subStatUpdates && eval_.subStatUpdates.length > 0 && (
        <motion.div
          className="p-3"
          style={{
            border: '1px solid #1e3a8a',
            borderRadius: '2px',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest mb-2">
            Skill Growth
          </p>
          <div className="space-y-1">
            {eval_.subStatUpdates.filter(u => u.increase > 0).map(update => {
              const allSubStats = Object.values(player.stats).flatMap(s => s.subStats)
              const ss = allSubStats.find(s => s.id === update.id)
              if (!ss) return null
              const color = getStatColor(ss.parentStat)
              return (
                <div key={update.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#94a3b8] flex-1">{ss.name}</span>
                  <span className="font-orbitron text-[10px]" style={{ color }}>
                    +{update.increase}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Debuffs applied */}
      {eval_.debuffsApplied.length > 0 && (
        <motion.div
          className="p-3"
          style={{
            border: '1px solid #7f1d1d',
            borderRadius: '2px',
            backgroundColor: 'rgba(127, 29, 29, 0.08)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="font-orbitron text-[9px] text-[#ef4444] uppercase tracking-widest mb-2">
            Debuffs Applied
          </p>
          {eval_.debuffsApplied.map(d => (
            <div key={d.id} className="text-[11px] text-[#ef4444] mb-1">
              ▼ {d.name}: {d.description}
            </div>
          ))}
        </motion.div>
      )}

      {/* Debuffs lifted */}
      {eval_.debuffsLifted.length > 0 && (
        <motion.div
          className="p-3"
          style={{
            border: '1px solid #064e3b',
            borderRadius: '2px',
            backgroundColor: 'rgba(6, 78, 59, 0.08)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="font-orbitron text-[9px] text-[#4fffb0] uppercase tracking-widest mb-1">
            Debuffs Cleared
          </p>
          <p className="text-[11px] text-[#4fffb0]">
            {eval_.debuffsLifted.length} debuff{eval_.debuffsLifted.length > 1 ? 's' : ''} removed.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
