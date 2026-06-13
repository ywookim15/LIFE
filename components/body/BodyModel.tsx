'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MuscleGroup, ALL_MUSCLES } from '@/lib/types'

interface Props {
  soreness: Record<MuscleGroup, number> // -1=never, 0=fresh, 0-1=sore
  onMuscleClick?: (m: MuscleGroup) => void
}

function sorenessColor(s: number): string {
  if (s < 0) return 'rgba(255,255,255,0.07)'
  if (s === 0) return 'rgba(220, 242, 255, 0.65)'
  const r = Math.round(147 - 117 * s)
  const g = Math.round(197 - 133 * s)
  const b = Math.round(253 - 78 * s)
  const a = 0.5 + 0.42 * s
  return `rgba(${r},${g},${b},${a})`
}

function sorenessStroke(s: number): string {
  if (s < 0) return '#1e3a8a'
  if (s === 0) return '#93c5fd'
  if (s < 0.5) return '#60a5fa'
  return '#3b82f6'
}

const BG = '#0d1420'
const BODY_FILL = '#141d2e'
const BODY_STROKE = '#1e3a8a'

type View = 'front' | 'back'

// Each entry: which muscles show in which view, and what SVG shapes to render
interface MuscleShapeDef {
  group: MuscleGroup
  views: View[]
  shapes: Array<{ type: 'rect'; x: number; y: number; w: number; h: number; rx?: number }
              | { type: 'path'; d: string }
              | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rotate?: number }>
}

const MUSCLE_SHAPES: MuscleShapeDef[] = [
  {
    group: 'shoulders',
    views: ['front', 'back'],
    shapes: [
      { type: 'path', d: 'M 66 76 C 56 68 40 69 33 80 C 26 93 34 110 47 112 C 57 114 66 105 66 96 Z' },
      { type: 'path', d: 'M 134 76 C 144 68 160 69 167 80 C 174 93 166 110 153 112 C 143 114 134 105 134 96 Z' },
    ],
  },
  {
    group: 'chest',
    views: ['front'],
    shapes: [
      { type: 'path', d: 'M 68 78 C 78 70 90 67 100 67 C 110 67 122 70 132 78 L 131 116 C 120 124 112 126 100 126 C 88 126 80 124 69 116 Z' },
    ],
  },
  {
    group: 'back',
    views: ['back'],
    shapes: [
      { type: 'path', d: 'M 68 78 L 132 78 L 131 176 C 118 182 110 184 100 184 C 90 184 82 182 69 176 Z' },
    ],
  },
  {
    group: 'abs',
    views: ['front'],
    shapes: [
      { type: 'rect', x: 73, y: 128, w: 24, h: 10, rx: 4 },
      { type: 'rect', x: 103, y: 128, w: 24, h: 10, rx: 4 },
      { type: 'rect', x: 73, y: 141, w: 24, h: 10, rx: 4 },
      { type: 'rect', x: 103, y: 141, w: 24, h: 10, rx: 4 },
      { type: 'rect', x: 73, y: 154, w: 24, h: 10, rx: 4 },
      { type: 'rect', x: 103, y: 154, w: 24, h: 10, rx: 4 },
    ],
  },
  {
    group: 'biceps',
    views: ['front'],
    shapes: [
      { type: 'rect', x: 36, y: 80, w: 26, h: 52, rx: 9 },
      { type: 'rect', x: 138, y: 80, w: 26, h: 52, rx: 9 },
    ],
  },
  {
    group: 'triceps',
    views: ['back'],
    shapes: [
      { type: 'rect', x: 36, y: 80, w: 26, h: 52, rx: 9 },
      { type: 'rect', x: 138, y: 80, w: 26, h: 52, rx: 9 },
    ],
  },
  {
    group: 'forearms',
    views: ['front', 'back'],
    shapes: [
      { type: 'rect', x: 30, y: 135, w: 28, h: 66, rx: 9 },
      { type: 'rect', x: 142, y: 135, w: 28, h: 66, rx: 9 },
    ],
  },
  {
    group: 'quads',
    views: ['front'],
    shapes: [
      { type: 'rect', x: 70, y: 194, w: 27, h: 108, rx: 7 },
      { type: 'rect', x: 103, y: 194, w: 27, h: 108, rx: 7 },
    ],
  },
  {
    group: 'hamstrings',
    views: ['back'],
    shapes: [
      { type: 'rect', x: 70, y: 194, w: 27, h: 108, rx: 7 },
      { type: 'rect', x: 103, y: 194, w: 27, h: 108, rx: 7 },
    ],
  },
  {
    group: 'calves',
    views: ['front', 'back'],
    shapes: [
      { type: 'rect', x: 68, y: 306, w: 25, h: 114, rx: 7 },
      { type: 'rect', x: 107, y: 306, w: 25, h: 114, rx: 7 },
    ],
  },
]

function renderShape(
  shape: MuscleShapeDef['shapes'][0],
  fill: string,
  stroke: string,
  key: number
) {
  const common = { fill, stroke, strokeWidth: 1, key }
  if (shape.type === 'rect') {
    return <rect {...common} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx ?? 6} />
  }
  if (shape.type === 'path') {
    return <path {...common} d={shape.d} />
  }
  if (shape.type === 'ellipse') {
    const transform = shape.rotate ? `rotate(${shape.rotate} ${shape.cx} ${shape.cy})` : undefined
    return <ellipse {...common} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} transform={transform} />
  }
}

export default function BodyModel({ soreness, onMuscleClick }: Props) {
  const [view, setView] = useState<View>('front')

  const visibleMuscles = MUSCLE_SHAPES.filter(m => m.views.includes(view))

  return (
    <div className="flex flex-col items-center gap-3">
      {/* View toggle */}
      <div className="flex gap-2">
        {(['front', 'back'] as View[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1 font-orbitron text-[9px] uppercase tracking-wider transition-all"
            style={{
              border: `1px solid ${view === v ? '#3b82f6' : '#1e3a8a'}`,
              borderRadius: '2px',
              backgroundColor: view === v ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: view === v ? '#93c5fd' : '#374151',
              cursor: 'pointer',
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* SVG body */}
      <motion.div
        key={view}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <svg
          viewBox="0 0 200 460"
          width="170"
          height="390"
          style={{ display: 'block' }}
        >
          {/* Background */}
          <rect x="0" y="0" width="200" height="460" fill={BG} />

          {/* Body silhouette (non-interactive) */}
          {/* Head */}
          <circle cx="100" cy="30" r="22" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />
          {/* Neck */}
          <rect x="89" y="52" width="22" height="18" rx="5" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Torso */}
          <path d="M 66 70 L 134 70 L 132 178 L 68 178 Z" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Hip/pelvis */}
          <rect x="64" y="180" width="72" height="16" rx="4" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Left upper arm */}
          <rect x="33" y="72" width="30" height="60" rx="10" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Right upper arm */}
          <rect x="137" y="72" width="30" height="60" rx="10" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Left forearm */}
          <rect x="27" y="134" width="32" height="72" rx="10" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Right forearm */}
          <rect x="141" y="134" width="32" height="72" rx="10" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Left hand */}
          <ellipse cx="43" cy="217" rx="13" ry="9" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Right hand */}
          <ellipse cx="157" cy="217" rx="13" ry="9" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Left upper leg */}
          <rect x="67" y="194" width="31" height="116" rx="8" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Right upper leg */}
          <rect x="102" y="194" width="31" height="116" rx="8" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Left lower leg */}
          <rect x="65" y="314" width="29" height="118" rx="8" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Right lower leg */}
          <rect x="106" y="314" width="29" height="118" rx="8" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Left foot */}
          <ellipse cx="80" cy="440" rx="18" ry="8" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />
          {/* Right foot */}
          <ellipse cx="120" cy="440" rx="18" ry="8" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.5" />

          {/* Muscle highlights */}
          {visibleMuscles.map(muscle => {
            const s = soreness[muscle.group]
            const fill = sorenessColor(s)
            const stroke = sorenessStroke(s)
            return (
              <g
                key={muscle.group}
                onClick={() => onMuscleClick?.(muscle.group)}
                style={{ cursor: onMuscleClick ? 'pointer' : 'default' }}
              >
                {muscle.shapes.map((shape, i) =>
                  renderShape(shape, fill, stroke, i)
                )}
              </g>
            )
          })}

          {/* Head features */}
          <circle cx="93" cy="27" r="2.5" fill="#374151" />
          <circle cx="107" cy="27" r="2.5" fill="#374151" />
          <path d="M 95 36 Q 100 40 105 36" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </motion.div>

      {/* Soreness legend */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {[
          { label: 'Fresh', color: 'rgba(220,242,255,0.65)', stroke: '#93c5fd' },
          { label: 'Mild', color: 'rgba(147,197,253,0.55)', stroke: '#60a5fa' },
          { label: 'Sore', color: 'rgba(59,130,246,0.7)', stroke: '#3b82f6' },
          { label: 'Very Sore', color: 'rgba(30,64,175,0.85)', stroke: '#2563eb' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <div
              className="w-3 h-3"
              style={{
                backgroundColor: item.color,
                border: `1px solid ${item.stroke}`,
                borderRadius: '2px',
              }}
            />
            <span className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
