'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'
import SystemPanel from '@/components/ui/SystemPanel'
import BodyModel from '@/components/body/BodyModel'
import MuscleRadar from '@/components/body/MuscleRadar'
import WorkoutCalendar from '@/components/body/WorkoutCalendar'
import ExerciseProgressChart from '@/components/body/ExerciseProgressChart'
import {
  MuscleGroup, ALL_MUSCLES, WorkoutLog, PlanExercise, LoggedExercise,
} from '@/lib/types'
import { generateId, getTodayDate } from '@/lib/gameLogic'

type Tab = 'overview' | 'plans' | 'log' | 'progress'

const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps',
  triceps: 'Triceps', forearms: 'Forearms', abs: 'Abs', quads: 'Quads',
  hamstrings: 'Hamstrings', calves: 'Calves',
}

function getMusclesoreness(muscle: MuscleGroup, logs: WorkoutLog[]): number {
  const now = Date.now()
  let mostRecent = 0
  for (const log of logs) {
    if (log.exercises.some(e => e.muscleGroups.includes(muscle))) {
      const t = new Date(log.date).getTime()
      if (t > mostRecent) mostRecent = t
    }
  }
  if (!mostRecent) return -1
  const hoursAgo = (now - mostRecent) / 3_600_000
  if (hoursAgo >= 72) return 0
  return Math.max(0, 1 - hoursAgo / 72)
}

// ─── Plan Creator ─────────────────────────────────────────────────────────────

interface PlanFormExercise {
  id: string
  name: string
  muscleGroups: MuscleGroup[]
  sets: number
  reps: number
  weight: number
}

function PlanCreator({ onDone }: { onDone: () => void }) {
  const addWorkoutPlan = useGameStore(s => s.addWorkoutPlan)
  const { notify } = useNotification()
  const [name, setName] = useState('')
  const [exercises, setExercises] = useState<PlanFormExercise[]>([])
  const [exName, setExName] = useState('')
  const [exMuscles, setExMuscles] = useState<Set<MuscleGroup>>(new Set())
  const [exSets, setExSets] = useState(3)
  const [exReps, setExReps] = useState(10)
  const [exWeight, setExWeight] = useState(0)

  const addExercise = () => {
    if (!exName.trim() || exMuscles.size === 0) return
    setExercises(prev => [...prev, {
      id: generateId(),
      name: exName.trim(),
      muscleGroups: [...exMuscles],
      sets: exSets, reps: exReps, weight: exWeight,
    }])
    setExName(''); setExMuscles(new Set()); setExSets(3); setExReps(10); setExWeight(0)
  }

  const save = () => {
    if (!name.trim() || exercises.length === 0) return
    addWorkoutPlan({ name: name.trim(), exercises })
    notify('WORKOUT PLAN CREATED.', 'success')
    onDone()
  }

  const toggleMuscle = (m: MuscleGroup) => {
    setExMuscles(prev => {
      const next = new Set(prev)
      next.has(m) ? next.delete(m) : next.add(m)
      return next
    })
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="space-y-1">
        <label className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest block">Plan Name</label>
        <input
          value={name} onChange={e => setName(e.target.value)}
          className="input-system w-full" placeholder="e.g. Push Day A"
        />
      </div>

      {exercises.length > 0 && (
        <div className="space-y-1.5">
          {exercises.map((ex, i) => (
            <div
              key={ex.id}
              className="flex items-center justify-between p-2"
              style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.05)' }}
            >
              <div>
                <p className="text-xs text-[#e2e8f0]">{ex.name}</p>
                <p className="font-orbitron text-[8px] text-[#64748b]">
                  {ex.sets}×{ex.reps} {ex.weight > 0 ? `@ ${ex.weight}lbs` : ''} · {ex.muscleGroups.join(', ')}
                </p>
              </div>
              <button
                onClick={() => setExercises(prev => prev.filter((_, j) => j !== i))}
                className="font-orbitron text-[8px] text-[#ef4444] px-2 py-1"
                style={{ border: '1px solid #7f1d1d', borderRadius: '2px' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add exercise form */}
      <div
        className="p-3 space-y-3"
        style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.05)' }}
      >
        <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">Add Exercise</p>
        <input
          value={exName} onChange={e => setExName(e.target.value)}
          className="input-system w-full" placeholder="Exercise name (e.g. Bench Press)"
        />

        <div>
          <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider mb-1.5">Muscle Groups</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_MUSCLES.map(m => (
              <button
                key={m}
                onClick={() => toggleMuscle(m)}
                className="px-2 py-0.5 font-orbitron text-[8px] uppercase tracking-wider transition-all"
                style={{
                  border: `1px solid ${exMuscles.has(m) ? '#ef4444' : '#1e3a8a'}`,
                  borderRadius: '2px',
                  backgroundColor: exMuscles.has(m) ? 'rgba(239,68,68,0.2)' : 'transparent',
                  color: exMuscles.has(m) ? '#ef4444' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {MUSCLE_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Sets', val: exSets, set: setExSets, min: 1, max: 10 },
            { label: 'Reps', val: exReps, set: setExReps, min: 1, max: 100 },
            { label: 'Weight (lbs)', val: exWeight, set: setExWeight, min: 0, max: 9999 },
          ].map(({ label, val, set, min, max }) => (
            <div key={label} className="space-y-1">
              <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">{label}</label>
              <input
                type="number" min={min} max={max} value={val}
                onChange={e => set(Number(e.target.value))}
                className="input-system w-full text-center"
              />
            </div>
          ))}
        </div>

        <button
          onClick={addExercise}
          disabled={!exName.trim() || exMuscles.size === 0}
          className="w-full py-2 font-orbitron text-[9px] uppercase tracking-wider transition-all"
          style={{
            border: '1px solid #1e3a8a', borderRadius: '2px',
            backgroundColor: 'rgba(30,58,138,0.15)', color: '#64748b', cursor: 'pointer',
          }}
        >
          + Add Exercise
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={onDone} className="btn-system flex-1 py-2 font-orbitron text-[9px]">Cancel</button>
        <button
          onClick={save}
          disabled={!name.trim() || exercises.length === 0}
          className="flex-1 py-2 font-orbitron text-[9px] uppercase tracking-wider transition-all"
          style={{
            border: '1px solid #3b82f6', borderRadius: '2px',
            backgroundColor: 'rgba(59,130,246,0.2)', color: '#93c5fd', cursor: 'pointer',
          }}
        >
          Save Plan
        </button>
      </div>
    </motion.div>
  )
}

// ─── Workout Logger ────────────────────────────────────────────────────────────

interface LogSet { reps: number; weight: number }
interface LogExForm { id: string; name: string; muscleGroups: MuscleGroup[]; sets: LogSet[] }

function WorkoutLogger({ onDone }: { onDone: () => void }) {
  const workoutPlans = useGameStore(s => s.workoutPlans)
  const logWorkout = useGameStore(s => s.logWorkout)
  const { notify } = useNotification()

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<LogExForm[]>([])
  const [notes, setNotes] = useState('')
  const [addExOpen, setAddExOpen] = useState(false)
  const [newExName, setNewExName] = useState('')
  const [newExMuscles, setNewExMuscles] = useState<Set<MuscleGroup>>(new Set())

  const loadPlan = (planId: string) => {
    const plan = workoutPlans.find(p => p.id === planId)
    if (!plan) return
    setSelectedPlanId(planId)
    setExercises(plan.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      muscleGroups: ex.muscleGroups,
      sets: Array.from({ length: ex.sets }, () => ({ reps: ex.reps, weight: ex.weight ?? 0 })),
    })))
  }

  const addCustomEx = () => {
    if (!newExName.trim() || newExMuscles.size === 0) return
    setExercises(prev => [...prev, {
      id: generateId(),
      name: newExName.trim(),
      muscleGroups: [...newExMuscles],
      sets: [{ reps: 10, weight: 0 }],
    }])
    setNewExName(''); setNewExMuscles(new Set()); setAddExOpen(false)
  }

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight', val: number) => {
    setExercises(prev => prev.map((ex, i) =>
      i !== exIdx ? ex : {
        ...ex,
        sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, [field]: val }),
      }
    ))
  }

  const addSet = (exIdx: number) => {
    setExercises(prev => prev.map((ex, i) =>
      i !== exIdx ? ex : {
        ...ex,
        sets: [...ex.sets, { reps: ex.sets[ex.sets.length - 1]?.reps ?? 10, weight: ex.sets[ex.sets.length - 1]?.weight ?? 0 }],
      }
    ))
  }

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises(prev => prev.map((ex, i) =>
      i !== exIdx ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
    ))
  }

  const removeExercise = (exIdx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== exIdx))
  }

  const save = () => {
    const withSets = exercises.filter(ex => ex.sets.length > 0)
    if (withSets.length === 0) return
    const plan = workoutPlans.find(p => p.id === selectedPlanId)
    const logData: Omit<WorkoutLog, 'id'> = {
      date: getTodayDate(),
      planId: selectedPlanId ?? undefined,
      planName: plan?.name,
      exercises: withSets.map(ex => ({
        name: ex.name,
        muscleGroups: ex.muscleGroups,
        sets: ex.sets,
      })) as LoggedExercise[],
      notes: notes.trim() || undefined,
    }
    logWorkout(logData)
    notify('WORKOUT LOGGED. PHY XP AWARDED.', 'success')
    onDone()
  }

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {/* Plan selector */}
      {workoutPlans.length > 0 && (
        <div className="space-y-1">
          <label className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest block">Load from Plan</label>
          <div className="flex flex-wrap gap-2">
            {workoutPlans.map(p => (
              <button
                key={p.id}
                onClick={() => loadPlan(p.id)}
                className="px-3 py-1.5 font-orbitron text-[9px] uppercase tracking-wider transition-all"
                style={{
                  border: `1px solid ${selectedPlanId === p.id ? '#3b82f6' : '#1e3a8a'}`,
                  borderRadius: '2px',
                  backgroundColor: selectedPlanId === p.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: selectedPlanId === p.id ? '#93c5fd' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercises */}
      {exercises.map((ex, exIdx) => (
        <div key={ex.id} style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.05)' }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e3a8a]">
            <div>
              <p className="font-orbitron text-xs text-[#e2e8f0]">{ex.name}</p>
              <p className="font-orbitron text-[8px] text-[#475569]">{ex.muscleGroups.map(m => MUSCLE_LABEL[m]).join(' · ')}</p>
            </div>
            <button
              onClick={() => removeExercise(exIdx)}
              className="font-orbitron text-[8px] text-[#ef4444] px-1.5 py-0.5"
              style={{ border: '1px solid #7f1d1d', borderRadius: '2px' }}
            >×</button>
          </div>

          <div className="p-3 space-y-1.5">
            <div className="grid grid-cols-3 gap-2 mb-1">
              {['Set', 'Reps', 'Weight (lbs)'].map(h => (
                <p key={h} className="font-orbitron text-[8px] text-[#374151] uppercase tracking-wider text-center">{h}</p>
              ))}
            </div>
            {ex.sets.map((set, setIdx) => (
              <div key={setIdx} className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center justify-center">
                  <span className="font-orbitron text-[10px] text-[#64748b]">{setIdx + 1}</span>
                </div>
                <input
                  type="number" min={1} max={999} value={set.reps}
                  onChange={e => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                  className="input-system text-center text-xs"
                />
                <div className="flex gap-1">
                  <input
                    type="number" min={0} max={9999} value={set.weight}
                    onChange={e => updateSet(exIdx, setIdx, 'weight', Number(e.target.value))}
                    className="input-system text-center text-xs flex-1"
                  />
                  {ex.sets.length > 1 && (
                    <button
                      onClick={() => removeSet(exIdx, setIdx)}
                      className="font-orbitron text-[8px] text-[#374151] px-1"
                      style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}
                    >×</button>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => addSet(exIdx)}
              className="w-full py-1 font-orbitron text-[8px] uppercase tracking-wider text-[#374151] hover:text-[#64748b] transition-colors"
              style={{ border: '1px dashed #1e3a8a', borderRadius: '2px' }}
            >
              + Add Set
            </button>
          </div>
        </div>
      ))}

      {/* Add custom exercise */}
      {!addExOpen ? (
        <button
          onClick={() => setAddExOpen(true)}
          className="w-full py-2 font-orbitron text-[9px] uppercase tracking-wider transition-all"
          style={{ border: '1px dashed #1e3a8a', borderRadius: '2px', color: '#374151' }}
        >
          + Add Exercise
        </button>
      ) : (
        <div className="p-3 space-y-3" style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}>
          <input
            value={newExName} onChange={e => setNewExName(e.target.value)}
            className="input-system w-full" placeholder="Exercise name"
          />
          <div className="flex flex-wrap gap-1.5">
            {ALL_MUSCLES.map(m => (
              <button
                key={m}
                onClick={() => setNewExMuscles(prev => {
                  const next = new Set(prev); next.has(m) ? next.delete(m) : next.add(m); return next
                })}
                className="px-2 py-0.5 font-orbitron text-[8px] uppercase tracking-wider transition-all"
                style={{
                  border: `1px solid ${newExMuscles.has(m) ? '#ef4444' : '#1e3a8a'}`,
                  borderRadius: '2px',
                  backgroundColor: newExMuscles.has(m) ? 'rgba(239,68,68,0.2)' : 'transparent',
                  color: newExMuscles.has(m) ? '#ef4444' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {MUSCLE_LABEL[m]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddExOpen(false)} className="btn-system flex-1 py-1.5 font-orbitron text-[9px]">Cancel</button>
            <button
              onClick={addCustomEx}
              disabled={!newExName.trim() || newExMuscles.size === 0}
              className="flex-1 py-1.5 font-orbitron text-[9px] uppercase tracking-wider"
              style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.15)', color: '#64748b', cursor: 'pointer' }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1">
        <label className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest block">Notes (optional)</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          className="textarea-system" rows={2} placeholder="How did it feel? Any PRs?"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={onDone} className="btn-system flex-1 py-2 font-orbitron text-[9px]">Cancel</button>
        <button
          onClick={save}
          disabled={exercises.filter(ex => ex.sets.length > 0).length === 0}
          className="flex-1 py-2.5 font-orbitron text-[10px] uppercase tracking-wider transition-all"
          style={{
            border: '1px solid #3b82f6', borderRadius: '2px',
            backgroundColor: 'rgba(59,130,246,0.25)', color: '#93c5fd', cursor: 'pointer',
          }}
        >
          Log Workout
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BodyPage() {
  const player = useGameStore(s => s.player)
  const workoutLogs = useGameStore(s => s.workoutLogs)
  const workoutPlans = useGameStore(s => s.workoutPlans)
  const deleteWorkoutPlan = useGameStore(s => s.deleteWorkoutPlan)
  const deleteWorkoutLog = useGameStore(s => s.deleteWorkoutLog)
  const { notify } = useNotification()

  const [tab, setTab] = useState<Tab>('overview')
  const [creatingPlan, setCreatingPlan] = useState(false)
  const [loggingWorkout, setLoggingWorkout] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)

  const now = new Date()
  const [calYear] = useState(now.getFullYear())
  const [calMonth] = useState(now.getMonth())

  const soreness = useMemo(() => {
    const result = {} as Record<MuscleGroup, number>
    for (const m of ALL_MUSCLES) result[m] = getMusclesoreness(m, workoutLogs)
    return result
  }, [workoutLogs])

  // All unique exercise names across all logs
  const allExercises = useMemo(() => {
    const names = new Set<string>()
    for (const log of workoutLogs) for (const ex of log.exercises) names.add(ex.name)
    return [...names].sort()
  }, [workoutLogs])

  if (!player) return null

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'plans', label: 'Plans' },
    { id: 'log', label: 'Log' },
    { id: 'progress', label: 'Progress' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="mb-2">
        <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase">Physical System</p>
        <h1 className="font-orbitron text-lg font-bold text-[#ef4444]">Body</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-1.5 font-orbitron text-[10px] uppercase tracking-wider transition-all"
            style={{
              border: `1px solid ${tab === t.id ? '#ef4444' : '#1e3a8a'}`,
              borderRadius: '2px',
              backgroundColor: tab === t.id ? 'rgba(239,68,68,0.15)' : 'transparent',
              color: tab === t.id ? '#ef4444' : '#64748b',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}

        <button
          onClick={() => { setTab('log'); setLoggingWorkout(true) }}
          className="ml-auto px-4 py-1.5 font-orbitron text-[10px] uppercase tracking-wider transition-all"
          style={{
            border: '1px solid #ef4444',
            borderRadius: '2px',
            backgroundColor: 'rgba(239,68,68,0.2)',
            color: '#ef4444',
            cursor: 'pointer',
            boxShadow: '0 0 8px rgba(239,68,68,0.2)',
          }}
        >
          + Log Workout
        </button>
      </div>

      {/* ── OVERVIEW ───────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Body model + muscle radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SystemPanel title="Muscle Map" delay={0}>
              <div className="p-4 flex justify-center">
                <BodyModel soreness={soreness} />
              </div>
            </SystemPanel>

            <SystemPanel title="Muscle Strength Radar" delay={0.05}>
              <div className="p-4">
                <MuscleRadar workoutLogs={workoutLogs} />
                <p className="font-orbitron text-[8px] text-[#374151] text-center mt-1">
                  Score = best est. 1RM vs elite benchmark
                </p>
              </div>
            </SystemPanel>
          </div>

          {/* Soreness status grid */}
          <SystemPanel title="Muscle Status" delay={0.1}>
            <div className="p-3 grid grid-cols-5 sm:grid-cols-5 gap-2">
              {ALL_MUSCLES.map(m => {
                const s = soreness[m]
                const label = s < 0 ? 'Rested' : s === 0 ? 'Fresh' : s < 0.4 ? 'Mild' : s < 0.7 ? 'Sore' : 'Very Sore'
                const color = s < 0 ? '#374151' : s === 0 ? '#93c5fd' : s < 0.4 ? '#60a5fa' : s < 0.7 ? '#3b82f6' : '#1d4ed8'
                return (
                  <div
                    key={m}
                    className="text-center p-2 space-y-0.5"
                    style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.05)' }}
                  >
                    <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider">{MUSCLE_LABEL[m]}</p>
                    <p className="font-orbitron text-[9px] font-bold" style={{ color }}>{label}</p>
                  </div>
                )
              })}
            </div>
          </SystemPanel>

          {/* Calendar */}
          <SystemPanel title="Workout Calendar" delay={0.15}>
            <div className="p-4">
              <WorkoutCalendar workoutLogs={workoutLogs} year={calYear} month={calMonth} />
            </div>
          </SystemPanel>
        </div>
      )}

      {/* ── PLANS ──────────────────────────────────────────────── */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <SystemPanel title="Workout Plans" delay={0}>
            <div className="p-4 space-y-4">
              {!creatingPlan ? (
                <>
                  {workoutPlans.length === 0 && (
                    <p className="font-orbitron text-[10px] text-[#374151] text-center py-4 uppercase tracking-wider">
                      No plans created yet
                    </p>
                  )}
                  {workoutPlans.map(plan => (
                    <div
                      key={plan.id}
                      className="p-3 space-y-2"
                      style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.05)' }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-orbitron text-xs text-[#e2e8f0]">{plan.name}</p>
                        <button
                          onClick={() => {
                            deleteWorkoutPlan(plan.id)
                            notify('Plan deleted.', 'error')
                          }}
                          className="font-orbitron text-[8px] text-[#ef4444] px-2 py-0.5"
                          style={{ border: '1px solid #7f1d1d', borderRadius: '2px' }}
                        >
                          Delete
                        </button>
                      </div>
                      <div className="space-y-1">
                        {plan.exercises.map(ex => (
                          <div key={ex.id} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-[#ef4444]" />
                            <span className="text-xs text-[#64748b]">{ex.name}</span>
                            <span className="font-orbitron text-[8px] text-[#374151]">
                              {ex.sets}×{ex.reps}{ex.weight ? ` @ ${ex.weight}lbs` : ''}
                            </span>
                            <span className="font-orbitron text-[8px] text-[#1e3a8a] ml-auto">
                              {ex.muscleGroups.map(m => MUSCLE_LABEL[m]).join(', ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setCreatingPlan(true)}
                    className="w-full py-2.5 font-orbitron text-[10px] uppercase tracking-wider transition-all"
                    style={{ border: '1px solid #ef4444', borderRadius: '2px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer' }}
                  >
                    + Create New Plan
                  </button>
                </>
              ) : (
                <PlanCreator onDone={() => setCreatingPlan(false)} />
              )}
            </div>
          </SystemPanel>
        </div>
      )}

      {/* ── LOG ────────────────────────────────────────────────── */}
      {tab === 'log' && (
        <div className="space-y-4">
          <SystemPanel title="Log Workout" delay={0}>
            <div className="p-4">
              {loggingWorkout ? (
                <WorkoutLogger onDone={() => setLoggingWorkout(false)} />
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setLoggingWorkout(true)}
                    className="w-full py-3 font-orbitron text-[11px] uppercase tracking-wider transition-all"
                    style={{
                      border: '1px solid #ef4444', borderRadius: '2px',
                      backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444',
                      cursor: 'pointer', boxShadow: '0 0 12px rgba(239,68,68,0.15)',
                    }}
                  >
                    Start Workout Session
                  </button>
                </div>
              )}
            </div>
          </SystemPanel>

          {/* Recent logs */}
          {workoutLogs.length > 0 && (
            <SystemPanel title="Recent Sessions" delay={0.1}>
              <div className="divide-y divide-[#1e3a8a]">
                {[...workoutLogs]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 10)
                  .map(log => (
                    <div key={log.id} className="p-3 flex items-start gap-3">
                      <div className="shrink-0">
                        <p className="font-orbitron text-[9px] text-[#64748b]">{log.date}</p>
                        {log.planName && (
                          <p className="font-orbitron text-[8px] text-[#1e3a8a] mt-0.5">{log.planName}</p>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#94a3b8]">
                          {log.exercises.map(e => e.name).join(' · ')}
                        </p>
                        <p className="font-orbitron text-[8px] text-[#374151] mt-0.5">
                          {log.exercises.reduce((sum, e) => sum + e.sets.length, 0)} sets total
                        </p>
                      </div>
                      <button
                        onClick={() => { deleteWorkoutLog(log.id); notify('Log deleted.', 'error') }}
                        className="font-orbitron text-[8px] text-[#374151] shrink-0 px-1.5 py-0.5 hover:text-[#ef4444] transition-colors"
                        style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            </SystemPanel>
          )}
        </div>
      )}

      {/* ── PROGRESS ───────────────────────────────────────────── */}
      {tab === 'progress' && (
        <div className="space-y-4">
          {allExercises.length === 0 ? (
            <SystemPanel title="1RM Progress" delay={0}>
              <div className="p-8 text-center">
                <p className="font-orbitron text-[10px] text-[#374151] uppercase tracking-wider">
                  Log workouts to see progression charts
                </p>
              </div>
            </SystemPanel>
          ) : (
            <>
              {/* Exercise selector */}
              <div className="flex flex-wrap gap-2">
                {allExercises.map(ex => (
                  <button
                    key={ex}
                    onClick={() => setSelectedExercise(ex)}
                    className="px-3 py-1.5 font-orbitron text-[9px] uppercase tracking-wider transition-all"
                    style={{
                      border: `1px solid ${selectedExercise === ex ? '#ef4444' : '#1e3a8a'}`,
                      borderRadius: '2px',
                      backgroundColor: selectedExercise === ex ? 'rgba(239,68,68,0.15)' : 'transparent',
                      color: selectedExercise === ex ? '#ef4444' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {selectedExercise && (
                <SystemPanel title={`${selectedExercise} — Est. 1RM Progress`} delay={0}>
                  <div className="p-4">
                    <ExerciseProgressChart workoutLogs={workoutLogs} exerciseName={selectedExercise} />
                    <p className="font-orbitron text-[8px] text-[#374151] mt-2 text-center">
                      Epley formula: weight × (1 + reps / 30)
                    </p>
                  </div>
                </SystemPanel>
              )}

              {!selectedExercise && (
                <SystemPanel title="1RM Progress" delay={0}>
                  <div className="p-8 text-center">
                    <p className="font-orbitron text-[10px] text-[#374151] uppercase tracking-wider">
                      Select an exercise above to view progress
                    </p>
                  </div>
                </SystemPanel>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
