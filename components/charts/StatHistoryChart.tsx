'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { StatSnapshot } from '@/lib/types'
import { ALL_STAT_KEYS, getStatColor, getStatLabel, formatDate } from '@/lib/gameLogic'

interface StatHistoryChartProps {
  history: StatSnapshot[]
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: { color: string; name: string; value: number }[]
  label?: string
}) => {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      className="p-2 space-y-1"
      style={{
        background: 'rgba(10, 15, 40, 0.95)',
        border: '1px solid #1e3a8a',
        borderRadius: '2px',
        fontSize: '10px',
        fontFamily: 'Orbitron, monospace',
      }}
    >
      <p className="text-[#64748b] text-[9px] mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-[#93c5fd] ml-1">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function StatHistoryChart({ history }: StatHistoryChartProps) {
  const data = useMemo(() => {
    return history.slice(-30).map(snap => ({
      date: snap.date,
      label: formatDate(snap.date),
      ...Object.fromEntries(ALL_STAT_KEYS.map(k => [k, snap.stats[k]])),
    }))
  }, [history])

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="font-orbitron text-[10px] text-[#374151] tracking-wider uppercase">
          Not enough data — earn XP to start tracking
        </p>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#1e3a8a" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.4} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 8, fontFamily: 'Orbitron, monospace', fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#1e3a8a' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 8, fontFamily: 'Orbitron, monospace', fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#1e3a8a' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '9px', fontFamily: 'Orbitron, monospace' }}
            formatter={(value) => <span style={{ color: getStatColor(value as typeof ALL_STAT_KEYS[number]) }}>{value}</span>}
          />
          {ALL_STAT_KEYS.map(stat => (
            <Line
              key={stat}
              type="monotone"
              dataKey={stat}
              stroke={getStatColor(stat)}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: getStatColor(stat) }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
