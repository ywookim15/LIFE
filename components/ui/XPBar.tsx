'use client'

import { motion } from 'framer-motion'

interface XPBarProps {
  current: number
  max: number
  level: number
  showValues?: boolean
  height?: number
  animated?: boolean
}

export default function XPBar({
  current,
  max,
  level,
  showValues = true,
  height = 8,
  animated = true,
}: XPBarProps) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0

  return (
    <div className="w-full space-y-1">
      {showValues && (
        <div className="flex justify-between items-center">
          <span className="font-orbitron text-[10px] text-[#64748b] tracking-widest uppercase">
            Level {level}
          </span>
          <span className="font-orbitron text-[10px] text-[#93c5fd]">
            {current.toLocaleString()} / {max.toLocaleString()} XP
          </span>
        </div>
      )}
      <div
        className="xp-bar-track relative w-full"
        style={{ height: `${height}px` }}
      >
        <motion.div
          className="xp-bar-fill absolute top-0 left-0 h-full"
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Glow dot at end of bar */}
        {pct > 2 && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#93c5fd]"
            style={{ boxShadow: '0 0 6px #93c5fd' }}
            initial={animated ? { left: 0 } : { left: `calc(${pct}% - 3px)` }}
            animate={{ left: `calc(${pct}% - 3px)` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </div>
      {showValues && (
        <div className="flex justify-end">
          <span className="font-orbitron text-[9px] text-[#64748b]">
            {pct.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}
