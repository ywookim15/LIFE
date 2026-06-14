'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { StatKey, Quest } from '@/lib/types'
import { getStatColor, getStatLabel, generateId } from '@/lib/gameLogic'

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
  const statConfig = useGameStore(s => s.statConfig)
  const addQuest = useGameStore(s => s.addQuest)
  const updateQuest = useGameStore(s => s.updateQuest)

  const isEdit = !!existingQuest

  const defaultStats: StatKey[] = existingQuest?.linkedStats
    ?? (existingQuest?.linkedStat ? [existingQuest.linkedStat] : statConfig[0] ? [statConfig[0].key] : [])

  const [title, setTitle] = useState(existingQuest?.title ?? '')
  const [shortTitle, setShortTitle] = useState(existingQuest?.shortTitle ?? '')
  const [description, setDescription] = useState(existingQuest?.description ?? '')
  const [type, setType] = useState<Quest['type']>(existingQuest?.type ?? defaultType)
  const [selectedStats, setSelectedStats] = useState<StatKey[]>(defaultStats)
  const [linkedSubStats, setLinkedSubStats] = useState<string[]>(existingQuest?.linkedSubStats ?? [])
  const [dueDate, setDueDate] = useState(existingQuest?.dueDate ?? '')
  const [dueTime, setDueTime] = useState(existingQuest?.dueTime ?? '')
  const [milestones, setMilestones] = useState<string[]>(
    existingQuest?.milestones?.map(m => m.title) ?? ['']
  )
  const [isRecurring, setIsRecurring] = useState(existingQuest?.isRecurring ?? true)

  // Sub-stats from ALL selected stats combined
  const currentSubStats = selectedStats.flatMap(k => player?.stats[k]?.subStats ?? [])

  const toggleStat = (key: StatKey) => {
    setSelectedStats(prev => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev // must keep at least one
        // Remove any linked sub-stats that belong to this stat
        const removedSubIds = new Set(player?.stats[key]?.subStats.map(ss => ss.id) ?? [])
        setLinkedSubStats(ls => ls.filter(id => !removedSubIds.has(id)))
        return prev.filter(k2 => k2 !== key)
      }
      return [...prev, key]
    })
  }

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

    const primaryStat = selectedStats[0] ?? statConfig[0]?.key ?? 'INT'
    const questData = {
      title: title.trim(),
      shortTitle: shortTitle.trim() || undefined,
      description: description.trim(),
      type,
      linkedStat: primaryStat,
      linkedStats: selectedStats.length > 1 ? selectedStats : undefined,
      linkedSubStats,
      dueDate: (type !== 'habit' && type !== 'lifePurpose' && dueDate) ? dueDate : undefined,
      dueTime: (type !== 'habit' && type !== 'lifePurpose' && dueDate && dueTime) ? dueTime : undefined,
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
        style={{ backgroundColor: 'var(--overlay-bg)' }}
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
                        border: `1px solid ${type === t ? tColor : 'var(--border-primary)'}`,
                        borderRadius: '2px',
                        backgroundColor: type === t ? `${tColor}22` : 'transparent',
                        color: type === t ? tColor : 'var(--text-muted)',
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

            {/* Short title for calendar */}
            <div className="space-y-1">
              <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
                Calendar Label <span className="normal-case font-normal text-[#374151]">— max 15 chars</span>
              </label>
              <input
                type="text"
                value={shortTitle}
                onChange={e => setShortTitle(e.target.value.slice(0, 15))}
                className="input-system"
                placeholder="Short label for calendar (optional)"
                maxLength={15}
              />
              <p className="font-orbitron text-[8px] text-[#374151]">{shortTitle.length}/15</p>
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

            {/* Linked skills — multi-select */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest">
                  Linked Skills
                </label>
                {selectedStats.length > 1 && (
                  <span
                    className="font-orbitron text-[8px] px-1.5 py-0.5"
                    style={{ border: '1px solid #3b82f6', borderRadius: '2px', color: '#93c5fd', backgroundColor: 'rgba(59,130,246,0.15)' }}
                  >
                    {selectedStats.length} selected · XP split evenly
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {statConfig.map(cfg => {
                  const color = getStatColor(cfg.key, statConfig)
                  const selected = selectedStats.includes(cfg.key)
                  return (
                    <button
                      key={cfg.key}
                      type="button"
                      onClick={() => toggleStat(cfg.key)}
                      className="py-1.5 px-3 font-orbitron text-[10px] uppercase tracking-wider transition-all"
                      style={{
                        border: `1px solid ${selected ? color : 'var(--border-primary)'}`,
                        borderRadius: '2px',
                        backgroundColor: selected ? `${color}28` : 'transparent',
                        color: selected ? color : 'var(--text-muted)',
                        boxShadow: selected ? `0 0 6px ${color}44` : 'none',
                      }}
                    >
                      {selected && <span className="mr-1 opacity-70">✓</span>}
                      {getStatLabel(cfg.key, statConfig)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Linked sub-stats — from all selected stats */}
            {currentSubStats.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
                  Linked Sub-Skills <span className="normal-case font-normal text-[#374151]">(optional — from selected skills)</span>
                </label>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto pr-1">
                  {currentSubStats.map(ss => (
                    <button
                      key={ss.id}
                      type="button"
                      onClick={() => toggleSubStat(ss.id)}
                      className="text-left py-1.5 px-2 text-[10px] transition-all"
                      style={{
                        border: `1px solid ${linkedSubStats.includes(ss.id) ? '#3b82f6' : 'var(--border-primary)'}`,
                        borderRadius: '2px',
                        backgroundColor: linkedSubStats.includes(ss.id) ? 'rgba(59,130,246,0.15)' : 'transparent',
                        color: linkedSubStats.includes(ss.id) ? '#93c5fd' : 'var(--text-muted)',
                      }}
                    >
                      {ss.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Due date + time */}
            {(type === 'today' || type === 'weekly' || type === 'yearly') && (
              <div className="space-y-1.5">
                <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
                  Due Date (optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="input-system"
                  />
                  <input
                    type="time"
                    value={dueTime}
                    onChange={e => setDueTime(e.target.value)}
                    className="input-system"
                    placeholder="Time (optional)"
                    disabled={!dueDate}
                    style={{ opacity: dueDate ? 1 : 0.4 }}
                  />
                </div>
              </div>
            )}

            {/* Milestones */}
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
                disabled={!title.trim()}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  background: title.trim() ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 58, 138, 0.1)',
                  border: `1px solid ${title.trim() ? '#3b82f6' : '#1e3a8a'}`,
                  color: title.trim() ? '#93c5fd' : '#374151',
                  cursor: title.trim() ? 'pointer' : 'not-allowed',
                  borderRadius: '2px',
                  textTransform: 'uppercase',
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
