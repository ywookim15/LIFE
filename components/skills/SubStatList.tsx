'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SubStat, StatConfig } from '@/lib/types'
import { useGameStore } from '@/lib/store'
import { getStatColor, getStatLabel } from '@/lib/gameLogic'
import AddSubStatForm from './AddSubStatForm'

interface SubStatListProps {
  stat: string
  statConfig?: StatConfig[]
  alwaysExpanded?: boolean
}

interface EditFormProps {
  subStat: SubStat
  color: string
  onSave: (updates: Partial<Pick<SubStat, 'name' | 'description'>>) => void
  onCancel: () => void
}

function EditSubStatForm({ subStat, color, onSave, onCancel }: EditFormProps) {
  const [name, setName] = useState(subStat.name)
  const [description, setDescription] = useState(subStat.description)

  return (
    <div
      className="p-2 space-y-2 border"
      style={{ borderColor: `${color}33`, borderRadius: '2px', backgroundColor: `${color}06` }}
    >
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        className="input-system w-full text-xs"
        placeholder="Skill name"
        autoFocus
        maxLength={32}
      />
      <input
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="input-system w-full text-xs"
        placeholder="What does this skill involve?"
        maxLength={120}
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ name: name.trim() || subStat.name, description: description.trim() })}
          className="flex-1 py-1 font-orbitron text-[9px] uppercase tracking-wider transition-all"
          style={{
            background: 'rgba(6, 95, 70, 0.3)',
            border: '1px solid #065f46',
            color: '#4fffb0',
            borderRadius: '2px',
            cursor: 'pointer',
          }}
        >
          SAVE
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-1 font-orbitron text-[9px] uppercase tracking-wider transition-all"
          style={{
            background: 'transparent',
            border: '1px solid #1e3a8a',
            color: '#64748b',
            borderRadius: '2px',
            cursor: 'pointer',
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  )
}

interface DeleteConfirmProps {
  name: string
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirm({ name, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2" style={{ borderRadius: '2px', backgroundColor: 'rgba(127,29,29,0.1)', border: '1px solid #7f1d1d' }}>
      <span className="font-orbitron text-[9px] text-[#ef4444] flex-1 uppercase tracking-wider truncate">
        DELETE {name}?
      </span>
      <button
        onClick={onConfirm}
        className="font-orbitron text-[9px] px-2 py-0.5 uppercase tracking-wider"
        style={{ color: '#ef4444', border: '1px solid #7f1d1d', borderRadius: '2px', cursor: 'pointer' }}
      >
        YES
      </button>
      <button
        onClick={onCancel}
        className="font-orbitron text-[9px] px-2 py-0.5 uppercase tracking-wider"
        style={{ color: '#64748b', border: '1px solid #1e3a8a', borderRadius: '2px', cursor: 'pointer' }}
      >
        NO
      </button>
    </div>
  )
}

export default function SubStatList({ stat, statConfig, alwaysExpanded = false }: SubStatListProps) {
  const player = useGameStore(s => s.player)
  const updateSubStat = useGameStore(s => s.updateSubStat)
  const deleteSubStat = useGameStore(s => s.deleteSubStat)
  const [expanded, setExpanded] = useState(alwaysExpanded)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!player) return null

  const block = player.stats[stat]
  if (!block) return null
  const color = getStatColor(stat, statConfig)

  const maxVal = Math.max(1, ...block.subStats.map(ss => ss.value))

  return (
    <div
      className="border"
      style={{
        borderColor: expanded ? `${color}44` : '#1e3a8a',
        borderRadius: '2px',
        backgroundColor: expanded ? `${color}06` : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <button
        onClick={() => !alwaysExpanded && setExpanded(s => !s)}
        className="w-full flex items-center justify-between p-3 text-left"
        style={{ cursor: alwaysExpanded ? 'default' : 'pointer' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-orbitron text-sm font-bold" style={{ color }}>
            {getStatLabel(stat, statConfig)}
          </span>
          <span
            className="font-orbitron text-[9px] px-1.5 py-0.5"
            style={{ border: `1px solid ${color}44`, borderRadius: '2px', color: '#64748b' }}
          >
            {block.subStats.length} skills
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-orbitron text-base font-black" style={{ color: '#93c5fd' }}>
            {block.value}
          </span>
          {!alwaysExpanded && (
            <span className="text-[#64748b] text-xs">{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </button>

      {/* Sub-stats list */}
      <AnimatePresence>
        {(expanded || alwaysExpanded) && (
          <motion.div
            initial={alwaysExpanded ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-3 pb-3 space-y-2 border-t border-[#1e3a8a]">
              <div className="pt-2 space-y-2">
                {block.subStats.length === 0 ? (
                  <p className="text-[11px] text-[#374151] italic py-1">
                    No skills assigned. Add one below.
                  </p>
                ) : (
                  block.subStats
                    .slice()
                    .sort((a, b) => b.value - a.value)
                    .map(ss => {
                      if (ss.id === editingId) {
                        return (
                          <EditSubStatForm
                            key={ss.id}
                            subStat={ss}
                            color={color}
                            onSave={(updates) => {
                              updateSubStat(ss.id, updates)
                              setEditingId(null)
                            }}
                            onCancel={() => setEditingId(null)}
                          />
                        )
                      }
                      if (ss.id === deletingId) {
                        return (
                          <DeleteConfirm
                            key={ss.id}
                            name={ss.name}
                            onConfirm={() => {
                              deleteSubStat(ss.id)
                              setDeletingId(null)
                            }}
                            onCancel={() => setDeletingId(null)}
                          />
                        )
                      }
                      const barPct = (ss.value / maxVal) * 100
                      return (
                        <div key={ss.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-[#94a3b8]">{ss.name}</span>
                                <span className="font-orbitron text-[10px] text-[#93c5fd] shrink-0">
                                  {ss.value}
                                </span>
                              </div>
                              {ss.description && (
                                <p className="text-[10px] text-[#475569] italic mt-0.5 leading-tight">
                                  {ss.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                onClick={() => { setEditingId(ss.id); setDeletingId(null) }}
                                className="p-0.5"
                                style={{ color: '#475569' }}
                                title="Edit skill"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => { setDeletingId(ss.id); setEditingId(null) }}
                                className="p-0.5"
                                style={{ color: '#374151' }}
                                title="Delete skill"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="h-[3px]" style={{ backgroundColor: '#1e3a8a', borderRadius: '2px' }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${barPct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      )
                    })
                )}
              </div>

              {adding ? (
                <div className="pt-1">
                  <AddSubStatForm
                    defaultStat={stat}
                    onClose={() => setAdding(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="w-full py-1.5 font-orbitron text-[9px] uppercase tracking-wider transition-all"
                  style={{
                    border: `1px dashed ${color}33`,
                    borderRadius: '2px',
                    color: `${color}66`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${color}88`
                    e.currentTarget.style.color = color
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${color}33`
                    e.currentTarget.style.color = `${color}66`
                  }}
                >
                  + Add Skill
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
