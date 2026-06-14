'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Quest } from '@/lib/types'
import { getStatColor, formatDate, getTodayDate } from '@/lib/gameLogic'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'
import QuestForm from './QuestForm'
import HabitHeatmap from './HabitHeatmap'

interface QuestCardProps {
  quest: Quest
  defaultType: Quest['type']
}

const TYPE_COLORS: Record<Quest['type'], string> = {
  habit: '#3b82f6',
  today: '#a855f7',
  weekly: '#f97316',
  yearly: '#fbbf24',
  lifePurpose: '#ec4899',
}

const STATUS_COLORS = {
  active: '#93c5fd',
  completed: '#4fffb0',
  failed: '#ef4444',
}

function isOverdue(quest: Quest): boolean {
  if (!quest.dueDate || quest.status !== 'active') return false
  return quest.dueDate < getTodayDate()
}

export default function QuestCard({ quest, defaultType }: QuestCardProps) {
  const completeQuest = useGameStore(s => s.completeQuest)
  const failQuest = useGameStore(s => s.failQuest)
  const deleteQuest = useGameStore(s => s.deleteQuest)
  const unlockQuest = useGameStore(s => s.unlockQuest)
  const updateMilestone = useGameStore(s => s.updateMilestone)
  const { notify } = useNotification()
  const [isEditing, setIsEditing] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)

  const statColor = getStatColor(quest.linkedStat)
  const overdue = isOverdue(quest)
  const typeColor = TYPE_COLORS[quest.type] ?? '#3b82f6'

  const handleComplete = () => {
    completeQuest(quest.id)
    notify(`QUEST COMPLETE. +XP pending evaluation.`, 'success')
  }

  const handleFail = () => {
    failQuest(quest.id)
    notify(`HABIT QUEST FAILED.`, 'error')
  }

  const completedMilestones = quest.milestones?.filter(m => m.completed).length ?? 0
  const totalMilestones = quest.milestones?.length ?? 0

  // For lifePurpose: only allow completing the next milestone in sequence
  const nextMilestoneIndex = quest.type === 'lifePurpose' && quest.milestones
    ? quest.milestones.findIndex(m => !m.completed)
    : -1

  const borderColor = overdue
    ? '#b45309'
    : quest.status === 'failed'
    ? '#7f1d1d'
    : quest.status === 'completed'
    ? '#064e3b'
    : '#1e3a8a'

  const bgColor = overdue
    ? 'rgba(180, 83, 9, 0.08)'
    : quest.status === 'failed'
    ? 'rgba(127, 29, 29, 0.08)'
    : quest.status === 'completed'
    ? 'rgba(6, 78, 59, 0.08)'
    : 'rgba(30, 58, 138, 0.06)'

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="p-3 border"
        style={{
          borderColor,
          backgroundColor: bgColor,
          borderRadius: '2px',
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span
                className="font-orbitron text-[9px] px-1.5 py-0.5 uppercase tracking-wider"
                style={{
                  color: typeColor,
                  border: `1px solid ${typeColor}55`,
                  borderRadius: '2px',
                  backgroundColor: `${typeColor}11`,
                }}
              >
                {quest.type === 'lifePurpose' ? 'PURPOSE' : quest.type}
              </span>
              <span
                className="font-orbitron text-[9px] px-1.5 py-0.5 uppercase tracking-wider"
                style={{
                  color: statColor,
                  border: `1px solid ${statColor}44`,
                  borderRadius: '2px',
                }}
              >
                {quest.linkedStat}
              </span>
              {quest.status !== 'active' && (
                <span
                  className="font-orbitron text-[9px] px-1.5 py-0.5 uppercase tracking-wider"
                  style={{
                    color: STATUS_COLORS[quest.status],
                    border: `1px solid ${STATUS_COLORS[quest.status]}44`,
                    borderRadius: '2px',
                  }}
                >
                  {quest.status}
                </span>
              )}
              {overdue && (
                <span
                  className="font-orbitron text-[9px] px-1.5 py-0.5 uppercase tracking-wider"
                  style={{
                    color: '#fbbf24',
                    border: '1px solid #b4530944',
                    borderRadius: '2px',
                    backgroundColor: 'rgba(180,83,9,0.15)',
                  }}
                >
                  OVERDUE
                </span>
              )}
              {quest.type === 'habit' && (quest.streak ?? 0) > 0 && (
                <span
                  className="font-orbitron text-[9px] px-1.5 py-0.5 tracking-wider"
                  style={{
                    color: '#fb923c',
                    border: '1px solid #78350f44',
                    borderRadius: '2px',
                    backgroundColor: 'rgba(251,146,60,0.1)',
                  }}
                >
                  🔥 {quest.streak} day streak
                </span>
              )}
            </div>
            <p className="text-sm text-[#e2e8f0] font-medium leading-tight">{quest.title}</p>
          </div>
        </div>

        {/* Description */}
        {quest.description && (
          <p className="text-[11px] text-[#64748b] mb-2 leading-relaxed">{quest.description}</p>
        )}

        {/* Due date */}
        {quest.dueDate && (
          <p className="text-[10px] mb-2" style={{ color: overdue ? '#fbbf24' : '#64748b' }}>
            <span className="font-orbitron text-[#374151] uppercase tracking-wider">Due: </span>
            {formatDate(quest.dueDate)}
          </p>
        )}

        {/* Milestones */}
        {quest.milestones && quest.milestones.length > 0 && (
          <div className="mb-2 space-y-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-wider">
                Milestones
              </span>
              <span className="font-orbitron text-[9px] text-[#93c5fd]">
                {completedMilestones}/{totalMilestones}
              </span>
            </div>
            {quest.milestones.map((m, idx) => {
              const isSequential = quest.type === 'lifePurpose'
              const isNextUp = isSequential && idx === nextMilestoneIndex
              const isLocked = isSequential && !m.completed && idx !== nextMilestoneIndex
              return (
                <div key={m.id} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isLocked) return
                      updateMilestone(quest.id, m.id, !m.completed)
                    }}
                    disabled={isLocked}
                    className="w-3.5 h-3.5 shrink-0 flex items-center justify-center"
                    style={{
                      border: `1px solid ${m.completed ? '#4fffb0' : isNextUp ? typeColor : '#1e3a8a'}`,
                      borderRadius: '2px',
                      backgroundColor: m.completed ? 'rgba(79,255,176,0.2)' : 'transparent',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? 0.4 : 1,
                    }}
                  >
                    {m.completed && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4l2 2 4-4" stroke="#4fffb0" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                    {isNextUp && !m.completed && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeColor }} />
                    )}
                  </button>
                  <span
                    className="text-[11px] leading-tight"
                    style={{
                      color: m.completed ? '#4fffb0' : isLocked ? '#374151' : '#94a3b8',
                      textDecoration: m.completed ? 'line-through' : 'none',
                    }}
                  >
                    {m.title}
                  </span>
                </div>
              )
            })}
            <div className="h-[2px] mt-1" style={{ backgroundColor: '#1e3a8a', borderRadius: '2px' }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: totalMilestones > 0 ? `${(completedMilestones / totalMilestones) * 100}%` : '0%',
                  backgroundColor: typeColor,
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {quest.status === 'active' && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1e3a8a]">
            <button
              onClick={handleComplete}
              className="flex-1 text-[9px] px-2 py-1"
              style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '9px',
                letterSpacing: '0.1em',
                background: 'rgba(6, 95, 70, 0.3)',
                border: '1px solid #065f46',
                color: '#4fffb0',
                cursor: 'pointer',
                borderRadius: '2px',
                padding: '5px 8px',
              }}
            >
              COMPLETE
            </button>
            {quest.type === 'habit' && (
              <button
                onClick={handleFail}
                className="text-[9px] px-2 py-1"
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  background: 'rgba(127, 29, 29, 0.3)',
                  border: '1px solid #7f1d1d',
                  color: '#ef4444',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  padding: '5px 8px',
                }}
              >
                FAIL
              </button>
            )}
            {/* Heatmap toggle for habits */}
            {quest.type === 'habit' && (
              <button
                onClick={() => setShowHeatmap(v => !v)}
                className="p-1"
                style={{ color: showHeatmap ? '#3b82f6' : '#64748b' }}
                title="View habit history"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="4" height="4" rx="0.5" />
                  <rect x="10" y="3" width="4" height="4" rx="0.5" />
                  <rect x="17" y="3" width="4" height="4" rx="0.5" />
                  <rect x="3" y="10" width="4" height="4" rx="0.5" />
                  <rect x="10" y="10" width="4" height="4" rx="0.5" />
                  <rect x="17" y="10" width="4" height="4" rx="0.5" />
                  <rect x="3" y="17" width="4" height="4" rx="0.5" />
                  <rect x="10" y="17" width="4" height="4" rx="0.5" />
                  <rect x="17" y="17" width="4" height="4" rx="0.5" />
                </svg>
              </button>
            )}
            {/* Edit button */}
            <button
              onClick={() => setIsEditing(true)}
              className="p-1"
              style={{ color: '#64748b' }}
              title="Edit quest"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {/* Delete button */}
            <button
              onClick={() => deleteQuest(quest.id)}
              className="p-1"
              style={{ color: '#374151' }}
              title="Delete quest"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>
        )}

        {/* History actions — unlock or delete completed/failed quests */}
        {quest.status !== 'active' && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1e3a8a]">
            <button
              onClick={() => { unlockQuest(quest.id); notify('Quest unlocked — XP reversed.', 'success') }}
              className="flex-1 font-orbitron text-[9px] px-2 py-1 uppercase tracking-wider"
              style={{
                background: 'rgba(30,58,138,0.3)',
                border: '1px solid #1e3a8a',
                color: '#93c5fd',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
            >
              Unlock
            </button>
            <button
              onClick={() => deleteQuest(quest.id)}
              className="p-1"
              style={{ color: '#374151', cursor: 'pointer' }}
              title="Delete quest"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>
        )}

        {/* Habit heatmap */}
        {showHeatmap && quest.type === 'habit' && (
          <div className="mt-2 pt-2 border-t border-[#1e3a8a]">
            <HabitHeatmap completionLog={quest.completionLog ?? []} />
          </div>
        )}
      </motion.div>

      {isEditing && (
        <QuestForm
          defaultType={defaultType}
          existingQuest={quest}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  )
}
