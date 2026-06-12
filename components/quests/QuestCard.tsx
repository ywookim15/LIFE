'use client'

import { motion } from 'framer-motion'
import { Quest } from '@/lib/types'
import { getStatColor, formatDate } from '@/lib/gameLogic'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'

interface QuestCardProps {
  quest: Quest
}

const TYPE_COLORS = {
  daily: '#3b82f6',
  side: '#a855f7',
  main: '#fbbf24',
}

const STATUS_COLORS = {
  active: '#93c5fd',
  completed: '#4fffb0',
  failed: '#ef4444',
}

export default function QuestCard({ quest }: QuestCardProps) {
  const completeQuest = useGameStore(s => s.completeQuest)
  const failQuest = useGameStore(s => s.failQuest)
  const deleteQuest = useGameStore(s => s.deleteQuest)
  const updateMilestone = useGameStore(s => s.updateMilestone)
  const { notify } = useNotification()
  const statColor = getStatColor(quest.linkedStat)

  const handleComplete = () => {
    completeQuest(quest.id)
    notify(`QUEST COMPLETE. +XP pending evaluation.`, 'success')
  }

  const handleFail = () => {
    failQuest(quest.id)
    notify(`DAILY QUEST FAILED. DEBUFF APPLIED: ${quest.linkedStat}.`, 'error')
  }

  const completedMilestones = quest.milestones?.filter(m => m.completed).length ?? 0
  const totalMilestones = quest.milestones?.length ?? 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-3 border"
      style={{
        borderColor: quest.status === 'failed'
          ? '#7f1d1d'
          : quest.status === 'completed'
          ? '#064e3b'
          : '#1e3a8a',
        backgroundColor:
          quest.status === 'failed'
            ? 'rgba(127, 29, 29, 0.08)'
            : quest.status === 'completed'
            ? 'rgba(6, 78, 59, 0.08)'
            : 'rgba(30, 58, 138, 0.06)',
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
                color: TYPE_COLORS[quest.type],
                border: `1px solid ${TYPE_COLORS[quest.type]}55`,
                borderRadius: '2px',
                backgroundColor: `${TYPE_COLORS[quest.type]}11`,
              }}
            >
              {quest.type}
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
        <p className="text-[10px] text-[#64748b] mb-2">
          <span className="font-orbitron text-[#374151] uppercase tracking-wider">Due: </span>
          {formatDate(quest.dueDate)}
        </p>
      )}

      {/* Milestones for main quests */}
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
          {quest.milestones.map(m => (
            <div key={m.id} className="flex items-center gap-2">
              <button
                onClick={() => updateMilestone(quest.id, m.id, !m.completed)}
                className="w-3.5 h-3.5 shrink-0 flex items-center justify-center"
                style={{
                  border: `1px solid ${m.completed ? '#4fffb0' : '#1e3a8a'}`,
                  borderRadius: '2px',
                  backgroundColor: m.completed ? 'rgba(79,255,176,0.2)' : 'transparent',
                }}
              >
                {m.completed && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4l2 2 4-4" stroke="#4fffb0" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              <span
                className="text-[11px] leading-tight"
                style={{
                  color: m.completed ? '#4fffb0' : '#94a3b8',
                  textDecoration: m.completed ? 'line-through' : 'none',
                }}
              >
                {m.title}
              </span>
            </div>
          ))}
          {/* Milestone progress bar */}
          <div className="h-[2px] mt-1" style={{ backgroundColor: '#1e3a8a', borderRadius: '2px' }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: totalMilestones > 0 ? `${(completedMilestones / totalMilestones) * 100}%` : '0%',
                backgroundColor: '#fbbf24',
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
            className="btn-system-success text-[9px] px-2 py-1 flex-1"
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
          {quest.type === 'daily' && (
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
    </motion.div>
  )
}
