'use client'

import { useMemo } from 'react'

interface HabitHeatmapProps {
  completionLog: { date: string; status: 'completed' | 'failed' }[]
}

const WEEKS = 12
const DAYS = 7

export default function HabitHeatmap({ completionLog }: HabitHeatmapProps) {
  const cells = useMemo(() => {
    const logMap = new Map(completionLog.map(e => [e.date, e.status]))
    const result: { date: string; status: 'completed' | 'failed' | 'empty' }[] = []
    const today = new Date()

    for (let i = WEEKS * DAYS - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const status = logMap.get(dateStr)
      result.push({ date: dateStr, status: status ?? 'empty' })
    }
    return result
  }, [completionLog])

  // Split into weeks (columns)
  const weeks: typeof cells[] = []
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(cells.slice(w * DAYS, (w + 1) * DAYS))
  }

  const getColor = (status: 'completed' | 'failed' | 'empty') => {
    if (status === 'completed') return '#22c55e'
    if (status === 'failed') return '#ef4444'
    return '#1e3a8a'
  }

  const getOpacity = (status: 'completed' | 'failed' | 'empty') => {
    if (status === 'empty') return 0.2
    return 0.85
  }

  const completedCount = completionLog.filter(e => e.status === 'completed').length
  const failedCount = completionLog.filter(e => e.status === 'failed').length

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-wider">
          Last {WEEKS} Weeks
        </span>
        <div className="flex items-center gap-3">
          <span className="font-orbitron text-[9px]" style={{ color: '#22c55e' }}>
            ✓ {completedCount}
          </span>
          <span className="font-orbitron text-[9px]" style={{ color: '#ef4444' }}>
            ✗ {failedCount}
          </span>
        </div>
      </div>
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.status}`}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: getColor(cell.status),
                  opacity: getOpacity(cell.status),
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#22c55e', opacity: 0.85 }} />
          <span className="text-[9px] text-[#475569]">Done</span>
        </div>
        <div className="flex items-center gap-1">
          <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#ef4444', opacity: 0.85 }} />
          <span className="text-[9px] text-[#475569]">Failed</span>
        </div>
        <div className="flex items-center gap-1">
          <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#1e3a8a', opacity: 0.2 }} />
          <span className="text-[9px] text-[#475569]">No data</span>
        </div>
      </div>
    </div>
  )
}
