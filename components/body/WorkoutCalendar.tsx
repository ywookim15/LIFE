'use client'

import { WorkoutLog } from '@/lib/types'

interface Props {
  workoutLogs: WorkoutLog[]
  year: number
  month: number // 0-based
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function WorkoutCalendar({ workoutLogs, year, month }: Props) {
  const workedDates = new Set(workoutLogs.map(l => l.date))
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="space-y-2">
      <p className="font-orbitron text-[10px] text-[#64748b] tracking-widest uppercase text-center">
        {MONTHS[month]} {year}
      </p>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="text-center font-orbitron text-[8px] text-[#374151] uppercase tracking-wider py-0.5">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = toDateStr(year, month, day)
          const hasWorkout = workedDates.has(dateStr)
          const isToday = dateStr === todayStr
          const isFuture = dateStr > todayStr

          return (
            <div key={dateStr} className="flex items-center justify-center py-0.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-orbitron text-[9px] transition-all"
                style={{
                  backgroundColor: hasWorkout
                    ? 'rgba(59,130,246,0.8)'
                    : isToday
                    ? 'rgba(30,58,138,0.4)'
                    : 'transparent',
                  border: isToday
                    ? '1px solid #3b82f6'
                    : hasWorkout
                    ? '1px solid #60a5fa'
                    : '1px solid transparent',
                  color: hasWorkout
                    ? '#e2e8f0'
                    : isToday
                    ? '#93c5fd'
                    : isFuture
                    ? '#1e3a8a'
                    : '#475569',
                  boxShadow: hasWorkout ? '0 0 6px rgba(59,130,246,0.4)' : 'none',
                }}
              >
                {day}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="flex justify-between pt-1">
        <span className="font-orbitron text-[9px] text-[#374151]">
          {cells.filter(d => d && workedDates.has(toDateStr(year, month, d as number))).length} sessions this month
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.8)', border: '1px solid #60a5fa' }} />
          <span className="font-orbitron text-[9px] text-[#374151]">Workout day</span>
        </div>
      </div>
    </div>
  )
}
