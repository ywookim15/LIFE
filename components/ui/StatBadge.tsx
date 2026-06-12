'use client'

import { StatKey } from '@/lib/types'
import { getStatColor, getStatLabel } from '@/lib/gameLogic'

interface StatBadgeProps {
  stat: StatKey
  value: number
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export default function StatBadge({ stat, value, size = 'md', showLabel = false }: StatBadgeProps) {
  const color = getStatColor(stat)

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="font-orbitron text-[10px] font-bold tracking-wider"
          style={{ color }}
        >
          {stat}
        </span>
        <span className="font-orbitron text-[10px] text-[#93c5fd]">{value}</span>
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-between px-2 py-1 border"
      style={{
        borderColor: `${color}44`,
        backgroundColor: `${color}0d`,
        borderRadius: '2px',
      }}
    >
      <div className="flex flex-col">
        <span
          className="font-orbitron text-xs font-bold tracking-wider"
          style={{ color }}
        >
          {stat}
        </span>
        {showLabel && (
          <span className="text-[9px] text-[#64748b]">{getStatLabel(stat)}</span>
        )}
      </div>
      <span
        className="font-orbitron text-lg font-bold"
        style={{ color: '#93c5fd' }}
      >
        {value}
      </span>
    </div>
  )
}
