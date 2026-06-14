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

// Muscle-specific intermediate strength benchmarks (estimated 1RM in lbs).
// These reflect natural variation in how much each muscle group can lift,
// so calves (which naturally handle heavier loads) don't dominate the chart.
const MUSCLE_BENCHMARKS: Record<MuscleGroup, number> = {
  chest: 135,       // flat bench intermediate
  back: 155,        // barbell row
  shoulders: 95,    // overhead press
  biceps: 60,       // barbell curl
  triceps: 90,      // close-grip bench / pushdown
  forearms: 40,     // wrist curl
  abs: 50,          // weighted ab work
  quads: 185,       // back squat
  hamstrings: 135,  // RDL / leg curl
  calves: 185,      // standing calf raise (naturally high — benchmark reflects that)
}

const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps',
  triceps: 'Triceps', forearms: 'Forearms', abs: 'Abs', quads: 'Quads',
  hamstrings: 'Hams', calves: 'Calves',
}

interface Props { workoutLogs: WorkoutLog[] }

export default function MuscleRadar({ workoutLogs }: Props) {
  const data = ALL_MUSCLES.map(m => {
    const best1RM = getBest1RM(m, workoutLogs)
    // Score: ratio vs benchmark × 100. 100 = hitting intermediate benchmark.
    // No artificial cap — elite levels will read above 100.
    const score = best1RM === 0 ? 0 : Math.round((best1RM / MUSCLE_BENCHMARKS[m]) * 100)
    return { muscle: MUSCLE_LABEL[m], score, actual1RM: best1RM, benchmark: MUSCLE_BENCHMARKS[m] }
  })

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
            formatter={(val, _name, props) => {
              const { actual1RM, benchmark } = props.payload ?? {}
              if (actual1RM === 0) return ['No data', '']
              return [`${actual1RM} lbs 1RM · ${val}% of benchmark (${benchmark} lbs)`, '']
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="font-orbitron text-[7px] text-center text-[#374151] mt-1">
        Score = % of intermediate benchmark per muscle group
      </p>
    </div>
  )
}

export { calc1RM }
