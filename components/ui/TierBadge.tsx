'use client'

import { Tier } from '@/lib/types'
import { getTierColor, getTierGlow } from '@/lib/gameLogic'

interface TierBadgeProps {
  tier: Tier
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
}

const SIZE_MAP = {
  sm: { badge: 'w-7 h-7 text-xs', label: 'text-[9px]' },
  md: { badge: 'w-10 h-10 text-sm', label: 'text-[10px]' },
  lg: { badge: 'w-14 h-14 text-xl', label: 'text-xs' },
  xl: { badge: 'w-20 h-20 text-3xl', label: 'text-sm' },
}

export default function TierBadge({ tier, size = 'md', showLabel = false }: TierBadgeProps) {
  const color = getTierColor(tier)
  const glow = getTierGlow(tier)
  const sizes = SIZE_MAP[size]

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizes.badge} flex items-center justify-center font-orbitron font-bold border-2`}
        style={{
          borderColor: color,
          color,
          boxShadow: glow !== 'none' ? glow : `0 0 8px ${color}44`,
          backgroundColor: `${color}11`,
          borderRadius: '2px',
        }}
      >
        {tier}
      </div>
      {showLabel && (
        <span
          className={`font-orbitron ${sizes.label} uppercase tracking-widest`}
          style={{ color }}
        >
          Tier {tier}
        </span>
      )}
    </div>
  )
}
