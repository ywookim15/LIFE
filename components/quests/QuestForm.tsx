'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { StatKey, Quest } from '@/lib/types'
import { ALL_STAT_KEYS, getStatColor, generateId } from '@/lib/gameLogic'

interface QuestFormProps {
  onClose: () => void
  defaultType?: Quest['type']
  existingQuest?: Quest
}

const TYPE_LABELS: Record<Quest['type'], string> = {
  habit: 'HABIT',
  today: 'TODAY',
  weekly: 'WEEKLY',
  yearly: 'YEARLY',
  lifePurpose: 'PURPOSE',
}

const TYPE_COLORS: Record<Quest['type'], string> = {
  habit: '#3b82f6',
  today: '#a855f7',
  weekly: '#f97316',
  yearly: '#fbbf24',
  lifePurpose: '#ec4899',
}

const ALL_TYPES: Quest['type'][] = ['habit', 'today', 'weekly', 'yearly', 'lifePurpose']

export default function QuestForm({ onClose, defaultType = 'habit', existingQuest }: QuestFormProps) {
  const player = useGameStore(s => s.player)
  const addQuest = useGameStore(s => s.addQuest)
  const updateQuest = useGameStore(s => s.updateQuest)

  const isEdit = !!existingQuest

  const [title, setTitle] = useState(existingQuest?.title ?? '')
  const [description, setDescription] = useState(existingQuest?.description ?? '')
  const [type, setType] = useState<Quest['type']>(existingQuest?.type ?? defaultType)
  const [linkedStat, setLinkedStat] = useState<StatKey>(existingQuest?.linkedStat ?? 'INT')
  const [linkedSubStats, setLinkedSubStats] = useState<string[]>(existingQuest?.linkedSubStats ?? [])
  const [dueDate, setDueDate] = useState(existingQuest?.dueDate ?? '')
  const [milestones, setMilestones] = useState<string[]>(
    existingQuest?.milestones?.map(m => m.title) ?? ['']
  )
  const [isRecurring, setIsRecurring] = useState(existingQuest?.isRecurring ?? true)

  const allSubStats = player
    ? ALL_STAT_KEYS.flatMap(k => player.stats[k].subStats)
    : []

  const toggleSubStat = (id: string) => {
    setLinkedSubStats(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const hasMilestones = type === 'yearly' || type === 'lifePurpose'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const questMilestones = hasMilestones
      ? milestones
          .filter(m => m.trim())
          .map(m => ({ id: generateId(), title: m.trim(), completed: false }))
      : undefined

    const questData = {
      title: title.trim(),
      description: description.trim(),
      type,
      linkedStat,
      linkedSubStats,
      dueDate: (type !== 'habit' && type !== 'lifePurpose' && dueDate) ? dueDate : undefined,
      milestones: questMilestones,
      isRecurring: type === 'habit' ? isRecurring : undefined,
    }

    if (isEdit && existingQuest) {
      updateQuest(existingQuest.id, questData)
    } else {
      addQuest(questData)
    }
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(5, 7, 15, 0.9)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="panel w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
        >
          <div
            className="px-4 py-3 border-b border-[#1e3a8a] flex items-center justify-between"
            style={{ backgroundColor: 'rgba(30, 58, 138, 0.2)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" style={{ boxShadow: '0 0 6px #3b82f6' }} />
              <span className="font-orbitron text-[10px] tracking-[0.2em] text-[#93c5fd] uppercase">
                {isEdit ? 'Edit Quest' : 'New Quest'}
              </span>
            </div>
            <button onClick={onClose} style={{ color: '#64748b' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Quest type */}
            <div className="space-y-1.5">
              <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
                Quest Type
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {ALL_TYPES.map(t => {
                  const tColor = TYPE_COLORS[t]
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className="py-2 font-orbitron text-[9px] uppercase tracking-wider transition-all"
                      style={{
                        border: `1px solid ${type === t ? tColor : '#1e3a8a'}`,
                        borderRadius: '2px',
                        backgroundColor: type === t ? `${tColor}22` : 'transparent',
                        color: type === t ? tColor : '#64748b',
                      }}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Auto-reset toggle for habit */}
            {type === 'habit' && (
              <div className="flex items-center justify-between">
                <span className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest">
                  Auto-Reset Daily
                </span>
                <button
                  type="button"
                  onClick={() => setIsRecurring(v => !v)}
                  className="relative w-10 h-5 transition-all"
                  style={{
                    borderRadius: '9999px',
                    backgroundColor: isRecurring ? 'rgba(59,130,246,0.4)' : 'rgba(30,58,138,0.3)',
                    border: `1px solid ${isRecurring ? '#3b82f6' : '#1e3a8a'}`,
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 transition-all"
                    style={{
                      borderRadius: '9999px',
                      backgroundColor: isRecurring ? '#93c5fd' : '#374151',
                      left: isRecurring ? 'calc(100% - 18px)' : '2px',
                    }}
                  />
                </button>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
                Quest Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-system"
                placeholder="Name your objective..."
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="textarea-system"
                placeholder="Describe the quest parameters..."
                rows={3}
              />
            </div>

            {/* Linked stat */}
            <div className="space-y-1.5">
              <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
                Linked Stat
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ALL_STAT_KEYS.map(stat => (
                  <button
                    key={stat}
                    type="button"
                    onClick={() => setLinkedStat(stat)}
                    className="py-2 font-orbitron text-[11px] uppercase tracking-wider transition-all"
                    style={{
                      border: `1px solid ${linkedStat === stat ? getStatColor(stat) : '#1e3a8a'}`,
                      borderRadius: '2px',
                      backgroundColor: linkedStat === stat ? `${getStatColor(stat)}22` : 'transparent',
                      color: linkedStat === stat ? getStatColor(stat) : '#64748b',
                    }}
                  >
                    {stat}
                  </button>
                ))}
              </div>
            </div>

            {/* Linked sub-stats */}
            {allSubStats.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
                  Linked Sub-Stats (optional)
                </label>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto pr-1">
                  {allSubStats.map(ss => (
                    <button
                      key={ss.id}
                      type="button"
                      onClick={() => toggleSubStat(ss.id)}
                      className="text-left py-1.5 px-2 text-[10px] transition-all"
                      style={{
                        border: `1px solid ${linkedSubStats.includes(ss.id) ? '#3b82f6' : '#1e3a8a'}`,
                        borderRadius: '2px',
                        backgroundColor: linkedSubStats.includes(ss.id) ? 'rgba(59,130,246,0.15)' : 'transparent',
                        color: linkedSubStats.includes(ss.id) ? '#93c5fd' : '#64748b',
                      }}
                    >
                      {ss.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Due date (for today, weekly, yearly — NOT habit or lifePurpose) */}
            {(type === 'today' || type === 'weekly' || type === 'yearly') && (
              <div className="space-y-1.5">
                <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="input-system"
                />
              </div>
            )}

            {/* Milestones (for yearly and lifePurpose) */}
            {hasMilestones && (
              <div className="space-y-1.5">
                <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
                  Milestones {type === 'lifePurpose' && <span className="text-[#ec4899] ml-1">(sequential)</span>}
                </label>
                <div className="space-y-2">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      {type === 'lifePurpose' && (
                        <span className="font-orbitron text-[9px] text-[#ec4899] w-4 shrink-0 text-center">{i + 1}</span>
                      )}
                      <input
                        type="text"
                        value={m}
                        onChange={e => {
                          const updated = [...milestones]
                          updated[i] = e.target.value
                          setMilestones(updated)
                        }}
                        className="input-system flex-1"
                        placeholder={`Milestone ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => setMilestones(milestones.filter((_, j) => j !== i))}
                        style={{ color: '#64748b', padding: '0 4px' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMilestones([...milestones, ''])}
                    className="btn-system w-full text-[9px]"
                  >
                    + ADD MILESTONE
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-system flex-1 py-2.5">
                CANCEL
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 font-orbitron text-[11px] uppercase tracking-wider transition-all"
                disabled={!title.trim()}
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  background: title.trim() ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 58, 138, 0.1)',
                  border: `1px solid ${title.trim() ? '#3b82f6' : '#1e3a8a'}`,
                  color: title.trim() ? '#93c5fd' : '#374151',
                  cursor: title.trim() ? 'pointer' : 'not-allowed',
                  borderRadius: '2px',
                }}
              >
                {isEdit ? 'UPDATE QUEST' : 'CREATE QUEST'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
