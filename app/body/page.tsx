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
  MuscleGroup, ALL_MUSCLES, WorkoutLog, WorkoutPlan, PlanExercise, LoggedExercise, ManualPR, ExerciseType,
} from '@/lib/types'
import { generateId, getTodayDate, localDateStr } from '@/lib/gameLogic'

type Tab = 'overview' | 'plans' | 'log' | 'progress' | 'records'

const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps',
  triceps: 'Triceps', forearms: 'Forearms', abs: 'Abs', quads: 'Quads',
  hamstrings: 'Hamstrings', calves: 'Calves',
}

function getMusclesoreness(muscle: MuscleGroup, logs: WorkoutLog[]): number {
  // Score based on sets done in the most recent session + time decay over 72h.
  // Minimum meaningful soreness requires ≥ 3 sets; peaks at ~12+ sets.
  const now = Date.now()
  let mostRecentTs = 0
  let setsInSession = 0

  for (const log of logs) {
    const t = new Date(log.date).getTime()
    if (t <= mostRecentTs) continue
    const sets = log.exercises
      .filter(e => e.muscleGroups.includes(muscle))
      .reduce((sum, e) => sum + e.sets.length, 0)
    if (sets === 0) continue
    mostRecentTs = t
    setsInSession = sets
  }

  if (!mostRecentTs) return -1
  const hoursAgo = (now - mostRecentTs) / 3_600_000
  if (hoursAgo >= 72) return 0

  const timeDecay = Math.max(0, 1 - hoursAgo / 72)
  // Volume factor: 0 at <1 set, reaches 1.0 at 12 sets, soft-capped above
  const volumeFactor = Math.min(1, Math.max(0, (setsInSession - 1) / 11))
  return timeDecay * volumeFactor
}

// ─── Plan Creator ─────────────────────────────────────────────────────────────

interface PlanFormExercise {
  id: string
  name: string
  muscleGroups: MuscleGroup[]
  exerciseType: ExerciseType
  sets: number
  reps: number
  weight: number
}

function ExTypeButtons({ value, onChange }: { value: ExerciseType; onChange: (t: ExerciseType) => void }) {
  return (
    <div className="flex gap-1">
      {(['gym', 'calisthenics', 'cardio'] as ExerciseType[]).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className="flex-1 py-1 font-orbitron text-[8px] uppercase tracking-wider capitalize transition-all"
          style={{
            border: `1px solid ${value === t ? '#ef4444' : '#1e3a8a'}`,
            borderRadius: '2px',
            backgroundColor: value === t ? 'rgba(239,68,68,0.2)' : 'transparent',
            color: value === t ? '#ef4444' : '#475569',
            cursor: 'pointer',
          }}
        >{t}</button>
      ))}
    </div>
  )
}

function PlanCreator({ onDone, existingPlan }: { onDone: () => void; existingPlan?: WorkoutPlan }) {
  const addWorkoutPlan = useGameStore(s => s.addWorkoutPlan)
  const updateWorkoutPlan = useGameStore(s => s.updateWorkoutPlan)
  const { notify } = useNotification()
  const [name, setName] = useState(existingPlan?.name ?? '')
  const [exercises, setExercises] = useState<PlanFormExercise[]>(
    existingPlan?.exercises.map(e => ({ ...e, exerciseType: e.exerciseType ?? 'gym', weight: e.weight ?? 0 })) ?? []
  )
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  // Add-exercise form fields
  const [exName, setExName] = useState('')
  const [exMuscles, setExMuscles] = useState<Set<MuscleGroup>>(new Set())
  const [exType, setExType] = useState<ExerciseType>('gym')
  const [exSets, setExSets] = useState(3)
  const [exReps, setExReps] = useState(10)
  const [exWeight, setExWeight] = useState(0)

  const resetAddForm = () => {
    setExName(''); setExMuscles(new Set()); setExType('gym')
    setExSets(3); setExReps(10); setExWeight(0)
  }

  const addExercise = () => {
    if (!exName.trim() || exMuscles.size === 0) return
    setExercises(prev => [...prev, {
      id: generateId(),
      name: exName.trim(),
      muscleGroups: [...exMuscles],
      exerciseType: exType,
      sets: exSets, reps: exReps, weight: exWeight,
    }])
    resetAddForm()
  }

  const startEdit = (i: number) => {
    const ex = exercises[i]
    setExName(ex.name); setExMuscles(new Set(ex.muscleGroups)); setExType(ex.exerciseType)
    setExSets(ex.sets); setExReps(ex.reps); setExWeight(ex.weight)
    setEditingIdx(i)
  }

  const saveEdit = () => {
    if (editingIdx === null || !exName.trim() || exMuscles.size === 0) return
    setExercises(prev => prev.map((ex, i) => i !== editingIdx ? ex : {
      ...ex,
      name: exName.trim(),
      muscleGroups: [...exMuscles],
      exerciseType: exType,
      sets: exSets, reps: exReps, weight: exWeight,
    }))
    setEditingIdx(null); resetAddForm()
  }

  const cancelEdit = () => { setEditingIdx(null); resetAddForm() }

  const movePlanEx = (i: number, dir: -1 | 1) => {
    setExercises(prev => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const save = () => {
    if (!name.trim() || exercises.length === 0) return
    if (existingPlan) {
      updateWorkoutPlan(existingPlan.id, { name: name.trim(), exercises })
      notify('WORKOUT PLAN UPDATED.', 'success')
    } else {
      addWorkoutPlan({ name: name.trim(), exercises })
      notify('WORKOUT PLAN CREATED.', 'success')
    }
    onDone()
  }

  const toggleMuscle = (m: MuscleGroup) => {
    setExMuscles(prev => { const n = new Set(prev); n.has(m) ? n.delete(m) : n.add(m); return n })
  }

  const exSummary = (ex: PlanFormExercise) => {
    if (ex.exerciseType === 'cardio') return `${ex.sets} sets · ${ex.muscleGroups.join(', ')}`
    if (ex.exerciseType === 'calisthenics') return `${ex.sets}×${ex.reps} · ${ex.muscleGroups.join(', ')}`
    return `${ex.sets}×${ex.reps}${ex.weight > 0 ? ` @ ${ex.weight}lbs` : ''} · ${ex.muscleGroups.join(', ')}`
  }

  const isEditing = editingIdx !== null

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="space-y-1">
        <label className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest block">Plan Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="input-system w-full" placeholder="e.g. Push Day A" />
      </div>

      {exercises.length > 0 && (
        <div className="space-y-1.5">
          {exercises.map((ex, i) => (
            <div key={ex.id}>
              {isEditing && editingIdx === i ? (
                /* Inline edit form */
                <div className="p-3 space-y-3" style={{ border: '1px solid #3b82f6', borderRadius: '2px', backgroundColor: 'rgba(59,130,246,0.07)' }}>
                  <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">Edit Exercise</p>
                  <input value={exName} onChange={e => setExName(e.target.value)} className="input-system w-full" placeholder="Exercise name" />
                  <div>
                    <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider mb-1">Type</p>
                    <ExTypeButtons value={exType} onChange={setExType} />
                  </div>
                  <div>
                    <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider mb-1.5">Muscle Groups</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_MUSCLES.map(m => (
                        <button key={m} onClick={() => toggleMuscle(m)} className="px-2 py-0.5 font-orbitron text-[8px] uppercase tracking-wider transition-all"
                          style={{ border: `1px solid ${exMuscles.has(m) ? '#ef4444' : '#1e3a8a'}`, borderRadius: '2px', backgroundColor: exMuscles.has(m) ? 'rgba(239,68,68,0.2)' : 'transparent', color: exMuscles.has(m) ? '#ef4444' : '#475569', cursor: 'pointer' }}>
                          {MUSCLE_LABEL[m]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {exType === 'gym' && (
                    <div className="grid grid-cols-3 gap-2">
                      {[{ label: 'Sets', val: exSets, set: setExSets, min: 1 }, { label: 'Reps', val: exReps, set: setExReps, min: 1 }, { label: 'Weight (lbs)', val: exWeight, set: setExWeight, min: 0 }].map(({ label, val, set, min }) => (
                        <div key={label} className="space-y-1">
                          <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">{label}</label>
                          <input type="number" min={min} value={val} onChange={e => set(Number(e.target.value))} className="input-system w-full text-center" />
                        </div>
                      ))}
                    </div>
                  )}
                  {exType === 'calisthenics' && (
                    <div className="grid grid-cols-2 gap-2">
                      {[{ label: 'Sets', val: exSets, set: setExSets, min: 1 }, { label: 'Reps', val: exReps, set: setExReps, min: 1 }].map(({ label, val, set, min }) => (
                        <div key={label} className="space-y-1">
                          <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">{label}</label>
                          <input type="number" min={min} value={val} onChange={e => set(Number(e.target.value))} className="input-system w-full text-center" />
                        </div>
                      ))}
                    </div>
                  )}
                  {exType === 'cardio' && (
                    <div className="grid grid-cols-1 gap-2">
                      <div className="space-y-1">
                        <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">Default Sets</label>
                        <input type="number" min={1} value={exSets} onChange={e => setExSets(Number(e.target.value))} className="input-system w-full text-center" />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={cancelEdit} className="btn-system flex-1 py-1.5 font-orbitron text-[9px]">Cancel</button>
                    <button onClick={saveEdit} disabled={!exName.trim() || exMuscles.size === 0}
                      className="flex-1 py-1.5 font-orbitron text-[9px] uppercase tracking-wider"
                      style={{ border: '1px solid #3b82f6', borderRadius: '2px', backgroundColor: 'rgba(59,130,246,0.2)', color: '#93c5fd', cursor: 'pointer' }}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2" style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.05)' }}>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => movePlanEx(i, -1)} disabled={i === 0} className="font-orbitron text-[8px] px-1 leading-none"
                      style={{ color: i === 0 ? '#1e3a8a' : '#64748b', cursor: i === 0 ? 'default' : 'pointer' }}>▲</button>
                    <button onClick={() => movePlanEx(i, 1)} disabled={i === exercises.length - 1} className="font-orbitron text-[8px] px-1 leading-none"
                      style={{ color: i === exercises.length - 1 ? '#1e3a8a' : '#64748b', cursor: i === exercises.length - 1 ? 'default' : 'pointer' }}>▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-[#e2e8f0]">{ex.name}</p>
                      <span className="font-orbitron text-[7px] px-1 py-0.5 rounded" style={{ backgroundColor: ex.exerciseType === 'cardio' ? 'rgba(251,191,36,0.15)' : ex.exerciseType === 'calisthenics' ? 'rgba(74,222,128,0.15)' : 'rgba(147,197,253,0.15)', color: ex.exerciseType === 'cardio' ? '#fbbf24' : ex.exerciseType === 'calisthenics' ? '#4ade80' : '#93c5fd' }}>{ex.exerciseType}</span>
                    </div>
                    <p className="font-orbitron text-[8px] text-[#64748b]">{exSummary(ex)}</p>
                  </div>
                  <button onClick={() => startEdit(i)} className="font-orbitron text-[8px] text-[#93c5fd] px-2 py-1 shrink-0" style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}>Edit</button>
                  <button onClick={() => setExercises(prev => prev.filter((_, j) => j !== i))} className="font-orbitron text-[8px] text-[#ef4444] px-2 py-1 shrink-0" style={{ border: '1px solid #7f1d1d', borderRadius: '2px' }}>×</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add exercise form (hidden while editing inline) */}
      {!isEditing && (
        <div className="p-3 space-y-3" style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.05)' }}>
          <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">Add Exercise</p>
          <input value={exName} onChange={e => setExName(e.target.value)} className="input-system w-full" placeholder="Exercise name (e.g. Bench Press)" />

          <div>
            <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider mb-1">Type</p>
            <ExTypeButtons value={exType} onChange={setExType} />
          </div>

          <div>
            <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider mb-1.5">Muscle Groups</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_MUSCLES.map(m => (
                <button key={m} onClick={() => toggleMuscle(m)} className="px-2 py-0.5 font-orbitron text-[8px] uppercase tracking-wider transition-all"
                  style={{ border: `1px solid ${exMuscles.has(m) ? '#ef4444' : '#1e3a8a'}`, borderRadius: '2px', backgroundColor: exMuscles.has(m) ? 'rgba(239,68,68,0.2)' : 'transparent', color: exMuscles.has(m) ? '#ef4444' : '#475569', cursor: 'pointer' }}>
                  {MUSCLE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          {exType === 'gym' && (
            <div className="grid grid-cols-3 gap-2">
              {[{ label: 'Sets', val: exSets, set: setExSets, min: 1 }, { label: 'Reps', val: exReps, set: setExReps, min: 1 }, { label: 'Weight (lbs)', val: exWeight, set: setExWeight, min: 0 }].map(({ label, val, set, min }) => (
                <div key={label} className="space-y-1">
                  <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">{label}</label>
                  <input type="number" min={min} value={val} onChange={e => set(Number(e.target.value))} className="input-system w-full text-center" />
                </div>
              ))}
            </div>
          )}
          {exType === 'calisthenics' && (
            <div className="grid grid-cols-2 gap-2">
              {[{ label: 'Sets', val: exSets, set: setExSets, min: 1 }, { label: 'Reps', val: exReps, set: setExReps, min: 1 }].map(({ label, val, set, min }) => (
                <div key={label} className="space-y-1">
                  <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">{label}</label>
                  <input type="number" min={min} value={val} onChange={e => set(Number(e.target.value))} className="input-system w-full text-center" />
                </div>
              ))}
            </div>
          )}
          {exType === 'cardio' && (
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">Default Sets</label>
                <input type="number" min={1} value={exSets} onChange={e => setExSets(Number(e.target.value))} className="input-system w-full text-center" />
              </div>
            </div>
          )}

          <button onClick={addExercise} disabled={!exName.trim() || exMuscles.size === 0}
            className="w-full py-2 font-orbitron text-[9px] uppercase tracking-wider transition-all"
            style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.15)', color: '#64748b', cursor: 'pointer' }}>
            + Add Exercise
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onDone} className="btn-system flex-1 py-2 font-orbitron text-[9px]">Cancel</button>
        <button onClick={save} disabled={!name.trim() || exercises.length === 0}
          className="flex-1 py-2 font-orbitron text-[9px] uppercase tracking-wider transition-all"
          style={{ border: '1px solid #3b82f6', borderRadius: '2px', backgroundColor: 'rgba(59,130,246,0.2)', color: '#93c5fd', cursor: 'pointer' }}>
          {existingPlan ? 'Save Changes' : 'Save Plan'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Workout Logger ────────────────────────────────────────────────────────────

interface LogSet { reps: number; weight: number; distance?: number; duration?: number }
interface LogExForm { id: string; name: string; muscleGroups: MuscleGroup[]; exerciseType: ExerciseType; sets: LogSet[] }

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

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
  const [newExType, setNewExType] = useState<ExerciseType>('gym')

  const loadPlan = (planId: string) => {
    const plan = workoutPlans.find(p => p.id === planId)
    if (!plan) return
    setSelectedPlanId(planId)
    setExercises(plan.exercises.map(ex => {
      const et = ex.exerciseType ?? 'gym'
      const defaultSet: LogSet = et === 'cardio'
        ? { reps: 0, weight: 0, distance: 0, duration: 0 }
        : et === 'calisthenics'
        ? { reps: ex.reps, weight: 0 }
        : { reps: ex.reps, weight: ex.weight ?? 0 }
      return { id: ex.id, name: ex.name, muscleGroups: ex.muscleGroups, exerciseType: et, sets: Array.from({ length: ex.sets }, () => ({ ...defaultSet })) }
    }))
  }

  const addCustomEx = () => {
    if (!newExName.trim() || newExMuscles.size === 0) return
    const defaultSet: LogSet = newExType === 'cardio'
      ? { reps: 0, weight: 0, distance: 0, duration: 0 }
      : newExType === 'calisthenics' ? { reps: 10, weight: 0 } : { reps: 10, weight: 0 }
    setExercises(prev => [...prev, { id: generateId(), name: newExName.trim(), muscleGroups: [...newExMuscles], exerciseType: newExType, sets: [defaultSet] }])
    setNewExName(''); setNewExMuscles(new Set()); setNewExType('gym'); setAddExOpen(false)
  }

  const updateSet = (exIdx: number, setIdx: number, field: keyof LogSet, val: number) => {
    setExercises(prev => prev.map((ex, i) =>
      i !== exIdx ? ex : { ...ex, sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, [field]: val }) }
    ))
  }

  const addSet = (exIdx: number) => {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex
      const last = ex.sets[ex.sets.length - 1]
      const newSet: LogSet = ex.exerciseType === 'cardio'
        ? { reps: 0, weight: 0, distance: last?.distance ?? 0, duration: last?.duration ?? 0 }
        : ex.exerciseType === 'calisthenics'
        ? { reps: last?.reps ?? 10, weight: 0 }
        : { reps: last?.reps ?? 10, weight: last?.weight ?? 0 }
      return { ...ex, sets: [...ex.sets, newSet] }
    }))
  }

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises(prev => prev.map((ex, i) => i !== exIdx ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }))
  }

  const removeExercise = (exIdx: number) => { setExercises(prev => prev.filter((_, i) => i !== exIdx)) }

  const moveLogEx = (i: number, dir: -1 | 1) => {
    setExercises(prev => {
      const next = [...prev]; const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]; return next
    })
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
        exerciseType: ex.exerciseType,
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
              <button key={p.id} onClick={() => loadPlan(p.id)}
                className="px-3 py-1.5 font-orbitron text-[9px] uppercase tracking-wider transition-all"
                style={{ border: `1px solid ${selectedPlanId === p.id ? '#3b82f6' : '#1e3a8a'}`, borderRadius: '2px', backgroundColor: selectedPlanId === p.id ? 'rgba(59,130,246,0.2)' : 'transparent', color: selectedPlanId === p.id ? '#93c5fd' : '#475569', cursor: 'pointer' }}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercises */}
      {exercises.map((ex, exIdx) => {
        const et = ex.exerciseType
        return (
          <div key={ex.id} style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.05)' }}>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e3a8a]">
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => moveLogEx(exIdx, -1)} disabled={exIdx === 0} className="font-orbitron text-[8px] leading-none px-0.5"
                  style={{ color: exIdx === 0 ? '#1e3a8a' : '#64748b', cursor: exIdx === 0 ? 'default' : 'pointer' }}>▲</button>
                <button onClick={() => moveLogEx(exIdx, 1)} disabled={exIdx === exercises.length - 1} className="font-orbitron text-[8px] leading-none px-0.5"
                  style={{ color: exIdx === exercises.length - 1 ? '#1e3a8a' : '#64748b', cursor: exIdx === exercises.length - 1 ? 'default' : 'pointer' }}>▼</button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-orbitron text-xs text-[#e2e8f0]">{ex.name}</p>
                  <span className="font-orbitron text-[7px] px-1 py-0.5 rounded" style={{ backgroundColor: et === 'cardio' ? 'rgba(251,191,36,0.15)' : et === 'calisthenics' ? 'rgba(74,222,128,0.15)' : 'rgba(147,197,253,0.15)', color: et === 'cardio' ? '#fbbf24' : et === 'calisthenics' ? '#4ade80' : '#93c5fd' }}>{et}</span>
                </div>
                <p className="font-orbitron text-[8px] text-[#475569]">{ex.muscleGroups.map(m => MUSCLE_LABEL[m]).join(' · ')}</p>
              </div>
              <button onClick={() => removeExercise(exIdx)} className="font-orbitron text-[8px] text-[#ef4444] px-1.5 py-0.5 shrink-0" style={{ border: '1px solid #7f1d1d', borderRadius: '2px' }}>×</button>
            </div>

            <div className="p-3 space-y-1.5">
              {/* Column headers */}
              {et === 'gym' && (
                <div className="grid grid-cols-3 gap-2 mb-1">
                  {['Set', 'Reps', 'Weight (lbs)'].map(h => <p key={h} className="font-orbitron text-[8px] text-[#374151] uppercase tracking-wider text-center">{h}</p>)}
                </div>
              )}
              {et === 'calisthenics' && (
                <div className="grid grid-cols-2 gap-2 mb-1">
                  {['Set', 'Reps'].map(h => <p key={h} className="font-orbitron text-[8px] text-[#374151] uppercase tracking-wider text-center">{h}</p>)}
                </div>
              )}
              {et === 'cardio' && (
                <div className="grid grid-cols-3 gap-2 mb-1">
                  {['Set', 'Dist (km)', 'Time (m:ss)'].map(h => <p key={h} className="font-orbitron text-[8px] text-[#374151] uppercase tracking-wider text-center">{h}</p>)}
                </div>
              )}

              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} className={`grid gap-2 items-center ${et === 'calisthenics' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  <div className="flex items-center justify-center">
                    <span className="font-orbitron text-[10px] text-[#64748b]">{setIdx + 1}</span>
                  </div>
                  {et === 'gym' && (
                    <>
                      <input type="number" min={1} max={999} value={set.reps} onChange={e => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))} className="input-system text-center text-xs" />
                      <div className="flex gap-1">
                        <input type="number" min={0} max={9999} value={set.weight} onChange={e => updateSet(exIdx, setIdx, 'weight', Number(e.target.value))} className="input-system text-center text-xs flex-1" />
                        {ex.sets.length > 1 && <button onClick={() => removeSet(exIdx, setIdx)} className="font-orbitron text-[8px] text-[#374151] px-1" style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}>×</button>}
                      </div>
                    </>
                  )}
                  {et === 'calisthenics' && (
                    <div className="flex gap-1">
                      <input type="number" min={1} max={999} value={set.reps} onChange={e => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))} className="input-system text-center text-xs flex-1" />
                      {ex.sets.length > 1 && <button onClick={() => removeSet(exIdx, setIdx)} className="font-orbitron text-[8px] text-[#374151] px-1" style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}>×</button>}
                    </div>
                  )}
                  {et === 'cardio' && (
                    <>
                      {/* Distance in km */}
                      <input type="number" min={0} step={0.1} value={((set.distance ?? 0) / 1000).toFixed(1)}
                        onChange={e => updateSet(exIdx, setIdx, 'distance', Math.round(Number(e.target.value) * 1000))}
                        className="input-system text-center text-xs" />
                      {/* Duration as min:sec — two small inputs */}
                      <div className="flex gap-0.5 items-center">
                        <input type="number" min={0} max={999} value={Math.floor((set.duration ?? 0) / 60)}
                          onChange={e => updateSet(exIdx, setIdx, 'duration', Number(e.target.value) * 60 + ((set.duration ?? 0) % 60))}
                          className="input-system text-center text-xs flex-1" placeholder="m" />
                        <span className="font-orbitron text-[8px] text-[#475569]">:</span>
                        <input type="number" min={0} max={59} value={(set.duration ?? 0) % 60}
                          onChange={e => updateSet(exIdx, setIdx, 'duration', Math.floor((set.duration ?? 0) / 60) * 60 + Number(e.target.value))}
                          className="input-system text-center text-xs flex-1" placeholder="ss" />
                        {ex.sets.length > 1 && <button onClick={() => removeSet(exIdx, setIdx)} className="font-orbitron text-[8px] text-[#374151] px-1 ml-0.5" style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}>×</button>}
                      </div>
                    </>
                  )}
                </div>
              ))}
              <button onClick={() => addSet(exIdx)} className="w-full py-1 font-orbitron text-[8px] uppercase tracking-wider text-[#374151] hover:text-[#64748b] transition-colors" style={{ border: '1px dashed #1e3a8a', borderRadius: '2px' }}>
                + Add Set
              </button>
            </div>
          </div>
        )
      })}

      {/* Add custom exercise */}
      {!addExOpen ? (
        <button onClick={() => setAddExOpen(true)} className="w-full py-2 font-orbitron text-[9px] uppercase tracking-wider transition-all" style={{ border: '1px dashed #1e3a8a', borderRadius: '2px', color: '#374151' }}>
          + Add Exercise
        </button>
      ) : (
        <div className="p-3 space-y-3" style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}>
          <input value={newExName} onChange={e => setNewExName(e.target.value)} className="input-system w-full" placeholder="Exercise name" />
          <div>
            <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider mb-1">Type</p>
            <ExTypeButtons value={newExType} onChange={setNewExType} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_MUSCLES.map(m => (
              <button key={m} onClick={() => setNewExMuscles(prev => { const n = new Set(prev); n.has(m) ? n.delete(m) : n.add(m); return n })}
                className="px-2 py-0.5 font-orbitron text-[8px] uppercase tracking-wider transition-all"
                style={{ border: `1px solid ${newExMuscles.has(m) ? '#ef4444' : '#1e3a8a'}`, borderRadius: '2px', backgroundColor: newExMuscles.has(m) ? 'rgba(239,68,68,0.2)' : 'transparent', color: newExMuscles.has(m) ? '#ef4444' : '#475569', cursor: 'pointer' }}>
                {MUSCLE_LABEL[m]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddExOpen(false)} className="btn-system flex-1 py-1.5 font-orbitron text-[9px]">Cancel</button>
            <button onClick={addCustomEx} disabled={!newExName.trim() || newExMuscles.size === 0}
              className="flex-1 py-1.5 font-orbitron text-[9px] uppercase tracking-wider"
              style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.15)', color: '#64748b', cursor: 'pointer' }}>
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
  const manualPRs = useGameStore(s => s.manualPRs)
  const addManualPR = useGameStore(s => s.addManualPR)
  const deleteManualPR = useGameStore(s => s.deleteManualPR)
  const deleteWorkoutPlan = useGameStore(s => s.deleteWorkoutPlan)
  const updateWorkoutPlan = useGameStore(s => s.updateWorkoutPlan)
  const deleteWorkoutLog = useGameStore(s => s.deleteWorkoutLog)
  const { notify } = useNotification()

  const [tab, setTab] = useState<Tab>(() =>
    (typeof window !== 'undefined' ? (sessionStorage.getItem('body-tab') as Tab) : null) ?? 'overview'
  )
  const changeTab = (t: Tab) => { sessionStorage.setItem('body-tab', t); setTab(t) }
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null)
  const [creatingPlan, setCreatingPlan] = useState(false)
  const [loggingWorkout, setLoggingWorkout] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const toggleLogExpand = (id: string) =>
    setExpandedLogs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const [addingPR, setAddingPR] = useState(false)
  const [prExName, setPrExName] = useState('')
  const [prWeight, setPrWeight] = useState(0)
  const [prReps, setPrReps] = useState(1)
  const [prNotes, setPrNotes] = useState('')
  const [prDate, setPrDate] = useState(getTodayDate())

  const now = new Date()
  const [calYear] = useState(now.getFullYear())
  const [calMonth] = useState(now.getMonth())

  const soreness = useMemo(() => {
    const result = {} as Record<MuscleGroup, number>
    for (const m of ALL_MUSCLES) result[m] = getMusclesoreness(m, workoutLogs)
    return result
  }, [workoutLogs])

  const volumeStats = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekStr = localDateStr(weekAgo)
    let totalVol = 0
    let weekVol = 0
    for (const log of workoutLogs) {
      let logVol = 0
      for (const ex of log.exercises) {
        for (const s of ex.sets) logVol += s.weight * s.reps
      }
      totalVol += logVol
      if (log.date >= weekStr) weekVol += logVol
    }
    const perWorkout = workoutLogs.length > 0 ? Math.round(totalVol / workoutLogs.length) : 0
    return { totalVol: Math.round(totalVol), weekVol: Math.round(weekVol), perWorkout }
  }, [workoutLogs])

  const sessionMaxPRs = useMemo(() => {
    const byExercise: Record<string, { date: string; weight: number; reps: number; est1RM: number }[]> = {}
    for (const log of workoutLogs) {
      for (const ex of log.exercises) {
        if (ex.exerciseType === 'calisthenics' || ex.exerciseType === 'cardio') continue
        const best = ex.sets.reduce<{ weight: number; reps: number; est1RM: number }>(
          (b, s) => {
            const est = s.weight * (1 + s.reps / 30)
            return est > b.est1RM ? { weight: s.weight, reps: s.reps, est1RM: est } : b
          },
          { weight: 0, reps: 0, est1RM: 0 }
        )
        if (!byExercise[ex.name]) byExercise[ex.name] = []
        byExercise[ex.name].push({ date: log.date, ...best })
      }
    }
    return byExercise
  }, [workoutLogs])

  const calisthenicsMaxReps = useMemo(() => {
    const byExercise: Record<string, { date: string; maxReps: number }> = {}
    for (const log of workoutLogs) {
      for (const ex of log.exercises) {
        if (ex.exerciseType !== 'calisthenics') continue
        const maxReps = ex.sets.reduce((m, s) => Math.max(m, s.reps), 0)
        if (!byExercise[ex.name] || maxReps > byExercise[ex.name].maxReps) {
          byExercise[ex.name] = { date: log.date, maxReps }
        }
      }
    }
    return byExercise
  }, [workoutLogs])

  const STANDARD_DISTANCES = [
    { label: '100m', meters: 100 }, { label: '200m', meters: 200 },
    { label: '400m', meters: 400 }, { label: '800m', meters: 800 },
    { label: '1K', meters: 1000 }, { label: '1.5K', meters: 1500 },
    { label: '1 mi', meters: 1609 }, { label: '3K', meters: 3000 },
    { label: '5K', meters: 5000 },
  ]

  const cardioPaceRecords = useMemo(() => {
    const byExercise: Record<string, Record<string, { duration: number; date: string; meters: number }>> = {}
    for (const log of workoutLogs) {
      for (const ex of log.exercises) {
        if (ex.exerciseType !== 'cardio') continue
        for (const s of ex.sets) {
          if (!s.distance || !s.duration || s.distance === 0 || s.duration === 0) continue
          const std = STANDARD_DISTANCES.find(d => Math.abs(s.distance! - d.meters) / d.meters < 0.02)
          if (!std) continue
          if (!byExercise[ex.name]) byExercise[ex.name] = {}
          const existing = byExercise[ex.name][std.label]
          if (!existing || s.duration < existing.duration) {
            byExercise[ex.name][std.label] = { duration: s.duration, date: log.date, meters: std.meters }
          }
        }
      }
    }
    return byExercise
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    { id: 'records', label: 'Records' },
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
            onClick={() => changeTab(t.id)}
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
          onClick={() => { changeTab('log'); setLoggingWorkout(true) }}
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

          {/* Volume stats */}
          <SystemPanel title="Volume Stats" delay={0.08}>
            <div className="p-3 grid grid-cols-3 gap-2">
              {[
                { label: 'Total Volume', value: `${volumeStats.totalVol.toLocaleString()} lbs` },
                { label: 'This Week', value: `${volumeStats.weekVol.toLocaleString()} lbs` },
                { label: 'Avg / Session', value: `${volumeStats.perWorkout.toLocaleString()} lbs` },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="text-center p-3"
                  style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(239,68,68,0.05)' }}
                >
                  <p className="font-orbitron text-sm font-bold text-[#ef4444]">{stat.value}</p>
                  <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-widest mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </SystemPanel>

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
              {editingPlan ? (
                <PlanCreator onDone={() => setEditingPlan(null)} existingPlan={editingPlan} />
              ) : !creatingPlan ? (
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
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-orbitron text-xs text-[#e2e8f0]">{plan.name}</p>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => setEditingPlan(plan)}
                            className="font-orbitron text-[8px] text-[#93c5fd] px-2 py-0.5"
                            style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { deleteWorkoutPlan(plan.id); notify('Plan deleted.', 'error') }}
                            className="font-orbitron text-[8px] text-[#ef4444] px-2 py-0.5"
                            style={{ border: '1px solid #7f1d1d', borderRadius: '2px' }}
                          >
                            Delete
                          </button>
                        </div>
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
                  .map(log => {
                    const expanded = expandedLogs.has(log.id)
                    return (
                      <div key={log.id}>
                        <div
                          className="p-3 flex items-start gap-3 cursor-pointer hover:bg-[rgba(30,58,138,0.08)] transition-colors"
                          onClick={() => toggleLogExpand(log.id)}
                        >
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
                              {log.exercises.reduce((sum, e) => sum + e.sets.length, 0)} sets · tap to {expanded ? 'collapse' : 'expand'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-orbitron text-[8px] text-[#374151]">{expanded ? '▲' : '▼'}</span>
                            <button
                              onClick={e => { e.stopPropagation(); deleteWorkoutLog(log.id); notify('Log deleted.', 'error') }}
                              className="font-orbitron text-[8px] text-[#374151] px-1.5 py-0.5 hover:text-[#ef4444] transition-colors"
                              style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        {expanded && (
                          <div className="px-3 pb-3 space-y-2 border-t border-[#1e3a8a]">
                            {log.exercises.map((ex, i) => (
                              <div key={i} className="pt-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <p className="font-orbitron text-[9px] text-[#93c5fd]">{ex.name}</p>
                                  {ex.exerciseType && ex.exerciseType !== 'gym' && (
                                    <span className="font-orbitron text-[7px] px-1 py-0.5 rounded" style={{ backgroundColor: ex.exerciseType === 'cardio' ? 'rgba(251,191,36,0.15)' : 'rgba(74,222,128,0.15)', color: ex.exerciseType === 'cardio' ? '#fbbf24' : '#4ade80' }}>{ex.exerciseType}</span>
                                  )}
                                </div>
                                <p className="font-orbitron text-[8px] text-[#374151] mb-1.5">{ex.muscleGroups.join(', ')}</p>
                                <div className="space-y-1">
                                  {ex.sets.map((s, j) => (
                                    <div key={j} className="flex items-center gap-3 px-2 py-1" style={{ background: 'rgba(30,58,138,0.06)', borderRadius: '2px' }}>
                                      <span className="font-orbitron text-[8px] text-[#374151] w-8">Set {j + 1}</span>
                                      {ex.exerciseType === 'cardio' ? (
                                        <>
                                          <span className="font-orbitron text-[9px] text-[#e2e8f0]">{s.distance ? (s.distance / 1000).toFixed(1) : 0} km</span>
                                          <span className="font-orbitron text-[9px] text-[#64748b]">{fmtDuration(s.duration ?? 0)}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="font-orbitron text-[9px] text-[#e2e8f0]">{s.reps} reps</span>
                                          {s.weight > 0 && <span className="font-orbitron text-[9px] text-[#64748b]">@ {s.weight} lbs</span>}
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {log.notes && <p className="text-[10px] italic text-[#475569] pt-1">{log.notes}</p>}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </SystemPanel>
          )}
        </div>
      )}

      {/* ── RECORDS ────────────────────────────────────────────── */}
      {tab === 'records' && (
        <div className="space-y-4">
          {/* Gym PRs */}
          <SystemPanel title="Gym — Best Estimated 1RM" delay={0}>
            <div className="divide-y divide-[#1e3a8a]">
              {Object.keys(sessionMaxPRs).length === 0 ? (
                <div className="p-6 text-center">
                  <p className="font-orbitron text-[10px] text-[#374151] uppercase tracking-wider">Log gym workouts to see PRs</p>
                </div>
              ) : (
                Object.entries(sessionMaxPRs).map(([exName, sessions]) => {
                  const best = sessions.reduce((b, s) => s.est1RM > b.est1RM ? s : b, sessions[0])
                  return (
                    <div key={exName} className="p-3 flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-orbitron text-xs text-[#e2e8f0]">{exName}</p>
                        <p className="font-orbitron text-[8px] text-[#64748b] mt-0.5">{best.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-orbitron text-sm font-bold text-[#ef4444]">{Math.round(best.est1RM)} lbs 1RM</p>
                        <p className="font-orbitron text-[8px] text-[#64748b]">{best.weight} × {best.reps}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </SystemPanel>

          {/* Calisthenics Max Reps */}
          <SystemPanel title="Calisthenics — Max Reps" delay={0.05}>
            <div className="divide-y divide-[#1e3a8a]">
              {Object.keys(calisthenicsMaxReps).length === 0 ? (
                <div className="p-6 text-center">
                  <p className="font-orbitron text-[10px] text-[#374151] uppercase tracking-wider">Log calisthenics workouts to see records</p>
                </div>
              ) : (
                Object.entries(calisthenicsMaxReps).map(([exName, rec]) => (
                  <div key={exName} className="p-3 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-orbitron text-xs text-[#e2e8f0]">{exName}</p>
                      <p className="font-orbitron text-[8px] text-[#64748b] mt-0.5">{rec.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-orbitron text-sm font-bold text-[#4ade80]">{rec.maxReps} reps</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SystemPanel>

          {/* Cardio Pace Records */}
          <SystemPanel title="Cardio — Running Pace Records" delay={0.08}>
            <div className="divide-y divide-[#1e3a8a]">
              {Object.keys(cardioPaceRecords).length === 0 ? (
                <div className="p-6 text-center">
                  <p className="font-orbitron text-[10px] text-[#374151] uppercase tracking-wider">Log cardio workouts to see pace records</p>
                </div>
              ) : (
                Object.entries(cardioPaceRecords).map(([exName, distMap]) => (
                  <div key={exName} className="p-3 space-y-2">
                    <p className="font-orbitron text-xs text-[#e2e8f0]">{exName}</p>
                    <div className="space-y-1">
                      {STANDARD_DISTANCES.filter(d => distMap[d.label]).map(d => {
                        const rec = distMap[d.label]
                        const paceSecPerKm = (rec.duration / rec.meters) * 1000
                        const paceMin = Math.floor(paceSecPerKm / 60)
                        const paceSec = Math.round(paceSecPerKm % 60)
                        return (
                          <div key={d.label} className="flex items-center gap-3 px-2 py-1" style={{ background: 'rgba(251,191,36,0.05)', borderRadius: '2px' }}>
                            <span className="font-orbitron text-[9px] text-[#fbbf24] w-12">{d.label}</span>
                            <span className="font-orbitron text-sm font-bold text-[#ef4444]">{fmtDuration(rec.duration)}</span>
                            <span className="font-orbitron text-[8px] text-[#64748b] ml-auto">{paceMin}:{paceSec.toString().padStart(2, '0')}/km</span>
                            <span className="font-orbitron text-[7px] text-[#374151]">{rec.date}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SystemPanel>

          {/* Manual PRs */}
          <SystemPanel title="Manual PRs" delay={0.1}>
            <div className="divide-y divide-[#1e3a8a]">
              {manualPRs.length === 0 && !addingPR && (
                <div className="p-4 text-center">
                  <p className="font-orbitron text-[10px] text-[#374151] uppercase tracking-wider">No manual PRs added</p>
                </div>
              )}
              {manualPRs
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(pr => (
                  <div key={pr.id} className="p-3 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-orbitron text-xs text-[#e2e8f0]">{pr.exerciseName}</p>
                      <p className="font-orbitron text-[8px] text-[#64748b] mt-0.5">{pr.date}</p>
                      {pr.notes && <p className="text-[10px] text-[#475569] italic mt-0.5">{pr.notes}</p>}
                    </div>
                    <div className="text-right mr-2">
                      <p className="font-orbitron text-sm font-bold text-[#ef4444]">{Math.round(pr.weight * (1 + pr.reps / 30))} lbs 1RM</p>
                      <p className="font-orbitron text-[8px] text-[#64748b]">{pr.weight} × {pr.reps}</p>
                    </div>
                    <button
                      onClick={() => { deleteManualPR(pr.id); notify('PR deleted.', 'error') }}
                      className="font-orbitron text-[8px] text-[#374151] px-1.5 py-0.5 hover:text-[#ef4444] transition-colors shrink-0"
                      style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}
                    >×</button>
                  </div>
                ))
              }

              {addingPR ? (
                <div className="p-4 space-y-3">
                  <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">Add Manual PR</p>
                  <input
                    className="input-system w-full"
                    placeholder="Exercise name"
                    value={prExName}
                    onChange={e => setPrExName(e.target.value)}
                    maxLength={64}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block mb-1">Weight (lbs)</label>
                      <input type="number" min={0} className="input-system text-center" value={prWeight} onChange={e => setPrWeight(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block mb-1">Reps</label>
                      <input type="number" min={1} className="input-system text-center" value={prReps} onChange={e => setPrReps(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block mb-1">Date</label>
                      <input type="date" className="input-system text-xs" value={prDate} onChange={e => setPrDate(e.target.value)} />
                    </div>
                  </div>
                  <input
                    className="input-system w-full"
                    placeholder="Notes (optional)"
                    value={prNotes}
                    onChange={e => setPrNotes(e.target.value)}
                    maxLength={120}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setAddingPR(false)} className="btn-system flex-1 py-2 font-orbitron text-[9px]">Cancel</button>
                    <button
                      onClick={() => {
                        if (!prExName.trim()) return
                        addManualPR({ exerciseName: prExName.trim(), weight: prWeight, reps: prReps, notes: prNotes.trim() || undefined, date: prDate })
                        notify('PR ADDED.', 'success')
                        setPrExName(''); setPrWeight(0); setPrReps(1); setPrNotes(''); setPrDate(getTodayDate())
                        setAddingPR(false)
                      }}
                      disabled={!prExName.trim()}
                      className="flex-1 py-2 font-orbitron text-[9px] uppercase tracking-wider"
                      style={{ border: '1px solid #ef4444', borderRadius: '2px', backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', opacity: prExName.trim() ? 1 : 0.4 }}
                    >Save PR</button>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <button
                    onClick={() => setAddingPR(true)}
                    className="w-full py-2 font-orbitron text-[9px] uppercase tracking-wider"
                    style={{ border: '1px dashed #7f1d1d', borderRadius: '2px', color: '#ef4444', cursor: 'pointer' }}
                  >+ Add Manual PR</button>
                </div>
              )}
            </div>
          </SystemPanel>
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
