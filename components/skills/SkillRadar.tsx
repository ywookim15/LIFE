'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Player, StatConfig } from '@/lib/types'
import { getStatColor, getStatLabel } from '@/lib/gameLogic'

const CX = 200
const CY = 200
const MAX_R = 150
const OUTER_R = 175
const SVG_SIZE = 400
const GAP_RAD = 0.15
const MIN_FLOOR = 0.15 // min radius fraction so lowest value isn't at center

function polar(angle: number, r: number) {
  return {
    x: CX + Math.cos(angle - Math.PI / 2) * r,
    y: CY + Math.sin(angle - Math.PI / 2) * r,
  }
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
  stat: string
  id: string
}

interface SkillRadarProps {
  player: Player
  statConfig?: StatConfig[]
}

export default function SkillRadar({ player, statConfig = [] }: SkillRadarProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const statKeys = useMemo(
    () => statConfig.map(c => c.key).filter(k => !!player.stats[k]),
    [statConfig, player.stats]
  )

  const numSectors = Math.max(1, statKeys.length)
  const SECTOR_RAD = (2 * Math.PI) / numSectors

  const { minVal, maxVal } = useMemo(() => {
    const all = statKeys.flatMap(k => player.stats[k]?.subStats.map(ss => ss.value) ?? [])
    if (all.length === 0) return { minVal: 0, maxVal: 1 }
    return { minVal: Math.min(...all), maxVal: Math.max(...all) }
  }, [statKeys, player.stats])

  const range = maxVal - minVal || 1

  const vertices = useMemo<Vertex[]>(() => {
    const result: Vertex[] = []
    statKeys.forEach((stat, sectorIdx) => {
      const sectorStart = sectorIdx * SECTOR_RAD + GAP_RAD / 2
      const sectorEnd = (sectorIdx + 1) * SECTOR_RAD - GAP_RAD / 2
      const sectorSpan = sectorEnd - sectorStart
      const subStats = player.stats[stat]?.subStats ?? []
      if (subStats.length === 0) return

      subStats.forEach((ss, j) => {
        let angle: number
        if (subStats.length === 1) {
          angle = (sectorStart + sectorEnd) / 2
        } else {
          angle = sectorStart + (j / (subStats.length - 1)) * sectorSpan
        }
        // Min-max normalize with a floor so even the min isn't at dead center
        const norm = MIN_FLOOR + ((ss.value - minVal) / range) * (1 - MIN_FLOOR)
        const r = norm * MAX_R
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
  }, [statKeys, player.stats, minVal, range, SECTOR_RAD])

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

        {/* Sector guide lines */}
        {statKeys.map((stat, i) => {
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

        {/* Outer arc segments + labels */}
        {statKeys.map((stat, i) => {
          const sectorStart = i * SECTOR_RAD + GAP_RAD / 2
          const sectorEnd = (i + 1) * SECTOR_RAD - GAP_RAD / 2
          const color = getStatColor(stat, statConfig)
          const mid = (sectorStart + sectorEnd) / 2
          const labelPos = polar(mid, OUTER_R + 22)
          const label = getStatLabel(stat, statConfig)
          const shortLabel = label.length > 6 ? label.slice(0, 5) + '…' : label
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
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontFamily="Orbitron, monospace"
                fontWeight="bold"
                fill={color}
              >
                {shortLabel}
              </text>
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
            stroke={getStatColor(v.stat, statConfig)}
            strokeWidth={0.5}
            opacity={0.2}
          />
        ))}

        {/* Per-sector filled areas */}
        {statKeys.map((stat) => {
          const color = getStatColor(stat, statConfig)
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

        {/* Polygon outline */}
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
          const color = getStatColor(v.stat, statConfig)
          const isHov = hovered === v.id
          return (
            <g key={v.id}>
              <circle cx={v.outerX} cy={v.outerY} r={2} fill={color} opacity={0.2} />
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

        {/* Tooltip */}
        {hovered && (() => {
          const v = vertices.find(vt => vt.id === hovered)
          if (!v) return null
          const color = getStatColor(v.stat, statConfig)
          const tx = v.x + (v.x > CX ? 10 : -10)
          const ty = v.y + (v.y > CY ? 10 : -24)
          const boxW = 90
          const boxH = 28
          const bx = v.x > CX ? tx : tx - boxW
          return (
            <g>
              <rect x={bx} y={ty - 4} width={boxW} height={boxH} rx={2} fill="#0a0f28" stroke={color} strokeWidth={0.8} opacity={0.95} />
              <text x={bx + 6} y={ty + 8} fontSize="9" fontFamily="Orbitron, monospace" fill={color}>{v.name}</text>
              <text x={bx + 6} y={ty + 18} fontSize="8" fontFamily="Orbitron, monospace" fill="#93c5fd">{v.value}</text>
            </g>
          )
        })()}

        {/* Empty state */}
        {!hasSubStats && (
          <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontFamily="Orbitron, monospace" fill="#374151">
            NO SKILLS ASSIGNED
          </text>
        )}

        <circle cx={CX} cy={CY} r={3} fill="#1e3a8a" />
      </svg>
    </div>
  )
}
