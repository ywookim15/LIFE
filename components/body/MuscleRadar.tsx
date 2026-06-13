'use client'

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts'
import { MuscleGroup, WorkoutLog, ALL_MUSCLES } from '@/lib/types'

// Epley formula for estimated 1RM
function calc1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

function getBest1RM(muscle: MuscleGroup, logs: WorkoutLog[]): number {
  let best = 0
  for (const log of logs) {
    for (const ex of log.exercises) {
      if (ex.muscleGroups.includes(muscle)) {
        for (const set of ex.sets) {
          const est = calc1RM(set.weight, set.reps)
          if (est > best) best = est
        }
      }
    }
  }
  return Math.round(best)
}

const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps',
  triceps: 'Triceps', forearms: 'Forearms', abs: 'Abs', quads: 'Quads',
  hamstrings: 'Hams', calves: 'Calves',
}

interface Props { workoutLogs: WorkoutLog[] }

export default function MuscleRadar({ workoutLogs }: Props) {
  const raw = ALL_MUSCLES.map(m => ({ muscle: MUSCLE_LABEL[m], value: getBest1RM(m, workoutLogs) }))
  const maxVal = Math.max(1, ...raw.map(r => r.value))
  const data = raw.map(r => ({ muscle: r.muscle, score: r.value, fullMark: maxVal }))

  return (
    <div className="w-full" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="#1e3a8a" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="muscle"
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'Orbitron, monospace' }}
          />
          <Radar
            name="Strength"
            dataKey="score"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.25}
            strokeWidth={1.5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0d1420',
              border: '1px solid #1e3a8a',
              borderRadius: '2px',
              fontFamily: 'Orbitron, monospace',
              fontSize: 10,
              color: '#93c5fd',
            }}
            formatter={(val) => [`${val ?? 0} lbs (est. 1RM)`, 'Strength']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export { calc1RM }
