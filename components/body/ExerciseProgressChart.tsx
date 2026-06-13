'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { WorkoutLog } from '@/lib/types'
import { calc1RM } from './MuscleRadar'

interface Props {
  workoutLogs: WorkoutLog[]
  exerciseName: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="p-2 font-orbitron text-[9px]"
      style={{ backgroundColor: '#0d1420', border: '1px solid #1e3a8a', borderRadius: '2px' }}
    >
      <p style={{ color: '#64748b' }}>{label}</p>
      <p style={{ color: '#ef4444' }}>{payload[0].value} lbs (est. 1RM)</p>
    </div>
  )
}

export default function ExerciseProgressChart({ workoutLogs, exerciseName }: Props) {
  // Collect best 1RM per date for this exercise
  const byDate = new Map<string, number>()

  for (const log of workoutLogs) {
    for (const ex of log.exercises) {
      if (ex.name.toLowerCase() !== exerciseName.toLowerCase()) continue
      let best = byDate.get(log.date) ?? 0
      for (const set of ex.sets) {
        const est = calc1RM(set.weight, set.reps)
        if (est > best) best = est
      }
      byDate.set(log.date, best)
    }
  }

  const data = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, oneRM]) => ({
      date: date.slice(5), // MM-DD
      oneRM: Math.round(oneRM),
    }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="font-orbitron text-[9px] text-[#374151] uppercase tracking-wider">No data yet</p>
      </div>
    )
  }

  return (
    <div style={{ height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#1e3a8a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#475569', fontSize: 8, fontFamily: 'Orbitron, monospace' }}
            axisLine={{ stroke: '#1e3a8a' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 8, fontFamily: 'Orbitron, monospace' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="oneRM"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }}
            activeDot={{ fill: '#f87171', r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
