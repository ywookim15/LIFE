'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { SubStat } from '@/lib/types'

const CX = 150
const CY = 150
const MAX_R = 110
const SVG_SIZE = 300

interface SubStatRadarProps {
  subStats: SubStat[]
  color: string
}

function polar(angle: number, r: number) {
  return {
    x: CX + Math.cos(angle - Math.PI / 2) * r,
    y: CY + Math.sin(angle - Math.PI / 2) * r,
  }
}

function BarChart({ subStats, color }: { subStats: SubStat[]; color: string }) {
  return (
    <div className="space-y-2 p-2">
      {subStats.map(ss => (
        <div key={ss.id} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#94a3b8]">{ss.name}</span>
            <span className="font-orbitron text-[10px] text-[#93c5fd]">
              {ss.value}<span className="text-[#374151]">/100</span>
            </span>
          </div>
          <div className="h-[4px]" style={{ backgroundColor: '#1e3a8a', borderRadius: '2px' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${ss.value}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SubStatRadar({ subStats, color }: SubStatRadarProps) {
  if (subStats.length === 0) {
    return (
      <div className="flex items-center justify-center h-24">
        <p className="font-orbitron text-[10px] text-[#374151] tracking-wider">
          NO SKILLS ASSIGNED
        </p>
      </div>
    )
  }

  if (subStats.length < 3) {
    return <BarChart subStats={subStats} color={color} />
  }

  return <WebChart subStats={subStats} color={color} />
}

function WebChart({ subStats, color }: { subStats: SubStat[]; color: string }) {
  const n = subStats.length
  const angleStep = (2 * Math.PI) / n
  const gridLevels = [25, 50, 75, 100]

  const points = useMemo(() =>
    subStats.map((ss, i) => {
      const angle = i * angleStep
      const r = (ss.value / 100) * MAX_R
      return {
        ...polar(angle, r),
        outerX: polar(angle, MAX_R).x,
        outerY: polar(angle, MAX_R).y,
        labelX: polar(angle, MAX_R + 18).x,
        labelY: polar(angle, MAX_R + 18).y,
        angle,
        name: ss.name,
        value: ss.value,
        id: ss.id,
      }
    }), [subStats, angleStep])

  const polygonPath = points.length >= 3
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`
    : ''

  const colorWithAlpha = `${color}55`

  return (
    <div className="flex items-center justify-center">
      <svg
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full max-w-[300px]"
      >
        {/* Grid circles */}
        {gridLevels.map(lvl => (
          <circle
            key={lvl}
            cx={CX}
            cy={CY}
            r={(lvl / 100) * MAX_R}
            fill="none"
            stroke="#1e3a8a"
            strokeWidth={0.5}
            strokeDasharray="2 3"
            opacity={0.5}
          />
        ))}

        {/* Axis lines from center to each vertex */}
        {points.map(p => (
          <line
            key={`axis-${p.id}`}
            x1={CX}
            y1={CY}
            x2={p.outerX}
            y2={p.outerY}
            stroke="#1e3a8a"
            strokeWidth={0.5}
            opacity={0.6}
          />
        ))}

        {/* Filled polygon */}
        {polygonPath && (
          <motion.path
            d={polygonPath}
            fill={colorWithAlpha}
            stroke={color}
            strokeWidth={1.5}
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        )}

        {/* Vertex dots */}
        {points.map(p => (
          <g key={p.id}>
            <circle cx={p.outerX} cy={p.outerY} r={2} fill={color} opacity={0.2} />
            <circle
              cx={p.x}
              cy={p.y}
              r={3.5}
              fill={color}
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          </g>
        ))}

        {/* Labels */}
        {points.map(p => {
          const isLeft = p.labelX < CX - 10
          const anchor = isLeft ? 'end' : p.labelX > CX + 10 ? 'start' : 'middle'
          return (
            <text
              key={`label-${p.id}`}
              x={p.labelX}
              y={p.labelY}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="9"
              fontFamily="Orbitron, monospace"
              fill={color}
              opacity={0.9}
            >
              {p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name}
            </text>
          )
        })}

        {/* Center dot */}
        <circle cx={CX} cy={CY} r={3} fill="#1e3a8a" />
      </svg>
    </div>
  )
}
