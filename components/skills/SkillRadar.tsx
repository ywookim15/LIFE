'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Player, StatKey } from '@/lib/types'
import { ALL_STAT_KEYS, getStatColor } from '@/lib/gameLogic'

const CX = 200
const CY = 200
const MAX_R = 150
const OUTER_R = 175
const SVG_SIZE = 400
const GAP_RAD = 0.15
const SECTOR_RAD = (2 * Math.PI) / 5

function polar(angle: number, r: number) {
  return {
    x: CX + Math.cos(angle - Math.PI / 2) * r,
    y: CY + Math.sin(angle - Math.PI / 2) * r,
  }
}

function svgArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const s = polar(startAngle, r)
  const e = polar(endAngle, r)
  const large = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${cx},${cy} L ${s.x},${s.y} A ${r},${r} 0 ${large},1 ${e.x},${e.y} Z`
}

function arcOnly(r: number, startAngle: number, endAngle: number): string {
  const s = polar(startAngle, r)
  const e = polar(endAngle, r)
  const large = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${s.x},${s.y} A ${r},${r} 0 ${large},1 ${e.x},${e.y}`
}

interface Vertex {
  x: number
  y: number
  outerX: number
  outerY: number
  angle: number
  name: string
  value: number
  stat: StatKey
  id: string
}

interface SkillRadarProps {
  player: Player
}

export default function SkillRadar({ player }: SkillRadarProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const vertices = useMemo<Vertex[]>(() => {
    const result: Vertex[] = []
    ALL_STAT_KEYS.forEach((stat, sectorIdx) => {
      const sectorStart = sectorIdx * SECTOR_RAD + GAP_RAD / 2
      const sectorEnd = (sectorIdx + 1) * SECTOR_RAD - GAP_RAD / 2
      const sectorSpan = sectorEnd - sectorStart
      const subStats = player.stats[stat].subStats
      if (subStats.length === 0) return

      subStats.forEach((ss, j) => {
        let angle: number
        if (subStats.length === 1) {
          angle = (sectorStart + sectorEnd) / 2
        } else {
          angle = sectorStart + (j / (subStats.length - 1)) * sectorSpan
        }
        const r = (ss.value / 100) * MAX_R
        const pos = polar(angle, r)
        const outerPos = polar(angle, MAX_R)
        result.push({
          x: pos.x,
          y: pos.y,
          outerX: outerPos.x,
          outerY: outerPos.y,
          angle,
          name: ss.name,
          value: ss.value,
          stat,
          id: ss.id,
        })
      })
    })
    return result
  }, [player.stats])

  const polygonPoints = vertices.map(v => `${v.x},${v.y}`).join(' ')
  const polygonPath = vertices.length > 2
    ? `M ${vertices.map(v => `${v.x},${v.y}`).join(' L ')} Z`
    : ''

  const gridLevels = [20, 40, 60, 80, 100]

  const hasSubStats = vertices.length > 0

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full max-w-[400px]"
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

        {/* Sector guide lines from center to outer */}
        {ALL_STAT_KEYS.map((stat, i) => {
          const sectorMid = i * SECTOR_RAD + SECTOR_RAD / 2
          const end = polar(sectorMid, MAX_R)
          return (
            <line
              key={stat}
              x1={CX}
              y1={CY}
              x2={end.x}
              y2={end.y}
              stroke="#1e3a8a"
              strokeWidth={0.5}
              opacity={0.4}
            />
          )
        })}

        {/* Outer arc segments per stat (color-coded) */}
        {ALL_STAT_KEYS.map((stat, i) => {
          const sectorStart = i * SECTOR_RAD + GAP_RAD / 2
          const sectorEnd = (i + 1) * SECTOR_RAD - GAP_RAD / 2
          const color = getStatColor(stat)
          return (
            <g key={stat}>
              <path
                d={arcOnly(OUTER_R + 8, sectorStart, sectorEnd)}
                fill="none"
                stroke={color}
                strokeWidth={3}
                opacity={0.7}
                strokeLinecap="round"
              />
              {/* Stat label */}
              {(() => {
                const mid = (sectorStart + sectorEnd) / 2
                const labelPos = polar(mid, OUTER_R + 22)
                return (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontFamily="Orbitron, monospace"
                    fontWeight="bold"
                    fill={color}
                  >
                    {stat}
                  </text>
                )
              })()}
            </g>
          )
        })}

        {/* Axis lines to each vertex */}
        {vertices.map(v => (
          <line
            key={`axis-${v.id}`}
            x1={CX}
            y1={CY}
            x2={v.outerX}
            y2={v.outerY}
            stroke={getStatColor(v.stat)}
            strokeWidth={0.5}
            opacity={0.2}
          />
        ))}

        {/* Per-sector filled areas */}
        {ALL_STAT_KEYS.map((stat) => {
          const color = getStatColor(stat)
          const sectorVerts = vertices.filter(v => v.stat === stat)
          if (sectorVerts.length === 0) return null
          const path = `M ${CX},${CY} ${sectorVerts.map(v => `L ${v.x},${v.y}`).join(' ')} Z`
          return (
            <path
              key={`fill-${stat}`}
              d={path}
              fill={color}
              fillOpacity={0.25}
              stroke={color}
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          )
        })}

        {/* Polygon outline connecting all vertices */}
        {polygonPath && (
          <motion.path
            d={polygonPath}
            fill="none"
            stroke="rgba(147, 197, 253, 0.4)"
            strokeWidth={1}
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}

        {/* Vertex dots */}
        {vertices.map(v => {
          const color = getStatColor(v.stat)
          const isHov = hovered === v.id
          return (
            <g key={v.id}>
              {/* Outer dot (reference) */}
              <circle
                cx={v.outerX}
                cy={v.outerY}
                r={2}
                fill={color}
                opacity={0.2}
              />
              {/* Value dot */}
              <circle
                cx={v.x}
                cy={v.y}
                r={isHov ? 5 : 3.5}
                fill={color}
                style={{
                  filter: isHov ? `drop-shadow(0 0 6px ${color})` : 'none',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHovered(v.id)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          )
        })}

        {/* Tooltip for hovered vertex */}
        {hovered && (() => {
          const v = vertices.find(vt => vt.id === hovered)
          if (!v) return null
          const color = getStatColor(v.stat)
          const tx = v.x + (v.x > CX ? 10 : -10)
          const ty = v.y + (v.y > CY ? 10 : -24)
          const boxW = 90
          const boxH = 28
          const bx = v.x > CX ? tx : tx - boxW
          return (
            <g>
              <rect
                x={bx}
                y={ty - 4}
                width={boxW}
                height={boxH}
                rx={2}
                fill="#0a0f28"
                stroke={color}
                strokeWidth={0.8}
                opacity={0.95}
              />
              <text
                x={bx + 6}
                y={ty + 8}
                fontSize="9"
                fontFamily="Orbitron, monospace"
                fill={color}
              >
                {v.name}
              </text>
              <text
                x={bx + 6}
                y={ty + 18}
                fontSize="8"
                fontFamily="Orbitron, monospace"
                fill="#93c5fd"
              >
                {v.value} / 100
              </text>
            </g>
          )
        })()}

        {/* Empty state */}
        {!hasSubStats && (
          <text
            x={CX}
            y={CY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontFamily="Orbitron, monospace"
            fill="#374151"
          >
            NO SUB-STATS ASSIGNED
          </text>
        )}

        {/* Center dot */}
        <circle cx={CX} cy={CY} r={3} fill="#1e3a8a" />
      </svg>
    </div>
  )
}
