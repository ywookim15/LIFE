'use client'

import { Debuff } from '@/lib/types'
import { getStatColor } from '@/lib/gameLogic'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'

interface DebuffCardProps {
  debuff: Debuff
  allowClear?: boolean
}

export default function DebuffCard({ debuff, allowClear = false }: DebuffCardProps) {
  const liftDebuff = useGameStore(s => s.liftDebuff)
  const { notify } = useNotification()
  const color = getStatColor(debuff.affectedStat)

  const handleClear = () => {
    liftDebuff(debuff.id)
    notify(`DEBUFF CLEARED: ${debuff.name}`, 'success')
  }

  return (
    <div
      className="p-3 border relative"
      style={{
        borderColor: '#7f1d1d',
        backgroundColor: 'rgba(127, 29, 29, 0.1)',
        borderRadius: '2px',
        boxShadow: '0 0 8px rgba(239, 68, 68, 0.15)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-orbitron text-[10px] text-[#ef4444] tracking-widest uppercase">
              DEBUFF
            </span>
            <span
              className="font-orbitron text-[9px] px-1 py-0.5"
              style={{
                color,
                borderColor: `${color}44`,
                border: `1px solid ${color}44`,
                borderRadius: '2px',
              }}
            >
              {debuff.affectedStat} -{debuff.penalty}
            </span>
          </div>
          <p className="text-[#e2e8f0] text-xs font-medium mb-1">{debuff.name}</p>
          <p className="text-[#64748b] text-[11px] mb-2">{debuff.description}</p>
          <div className="flex items-start gap-1.5">
            <span className="text-[#ef4444] text-[10px] font-orbitron uppercase tracking-wider shrink-0">
              Clear:
            </span>
            <span className="text-[#94a3b8] text-[11px]">{debuff.clearCondition}</span>
          </div>
        </div>
        {allowClear && (
          <button
            onClick={handleClear}
            className="btn-system-success shrink-0 text-[9px] px-2 py-1"
            style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '9px',
              letterSpacing: '0.1em',
              background: 'rgba(6, 95, 70, 0.3)',
              border: '1px solid #065f46',
              color: '#4fffb0',
              cursor: 'pointer',
              borderRadius: '2px',
              padding: '4px 8px',
            }}
          >
            CLEAR
          </button>
        )}
      </div>
    </div>
  )
}
