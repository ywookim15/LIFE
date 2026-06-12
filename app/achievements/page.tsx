'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'
import SystemPanel from '@/components/ui/SystemPanel'

export default function AchievementsPage() {
  const player = useGameStore(s => s.player)
  const achievements = useGameStore(s => s.achievements)
  const titles = useGameStore(s => s.titles)
  const equipTitle = useGameStore(s => s.equipTitle)
  const { notify } = useNotification()

  if (!player) return null

  const unlocked = achievements.filter(a => a.unlockedAt)
  const locked = achievements.filter(a => !a.unlockedAt)
  const unlockedTitles = titles.filter(t => t.unlockedAt)

  const handleEquipTitle = (titleId: string) => {
    const title = titles.find(t => t.id === titleId)
    if (!title) return
    equipTitle(titleId)
    notify(`TITLE EQUIPPED: ${title.name}`, 'success')
  }

  const conditionText = (ach: typeof achievements[0]) => {
    const { condition } = ach
    switch (condition.type) {
      case 'quest_count': return `Complete ${condition.count} quest${condition.count > 1 ? 's' : ''}`
      case 'tier_reached': return `Reach tier ${condition.tier}`
      case 'daily_streak': return `${condition.days}-day log streak`
      case 'debuff_cleared': return `Clear ${condition.count} debuff${condition.count > 1 ? 's' : ''}`
      case 'substat_value': return `Any sub-stat reaches ${condition.value}`
      case 'substat_count_above': return `${condition.count} sub-stats above ${condition.threshold}`
      case 'level_reached': return `Reach level ${condition.level}`
      case 'daily_xp': return `Earn ${condition.xp} XP in one evaluation`
      default: return 'Unknown condition'
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="mb-2">
        <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase">
          Record System
        </p>
        <h1 className="font-orbitron text-lg font-bold text-[#93c5fd]">
          Achievements &amp; Titles
        </h1>
      </div>

      {/* Stats bar */}
      <div
        className="flex items-center gap-4 p-3"
        style={{
          border: '1px solid #1e3a8a',
          borderRadius: '2px',
          backgroundColor: 'rgba(30, 58, 138, 0.1)',
        }}
      >
        <div className="text-center">
          <p className="font-orbitron text-lg font-bold text-[#fbbf24]">{unlocked.length}</p>
          <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-widest">Unlocked</p>
        </div>
        <div className="w-px h-8 bg-[#1e3a8a]" />
        <div className="text-center">
          <p className="font-orbitron text-lg font-bold text-[#374151]">{locked.length}</p>
          <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-widest">Locked</p>
        </div>
        <div className="w-px h-8 bg-[#1e3a8a]" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-orbitron text-[9px] text-[#64748b] uppercase">Progress</p>
            <p className="font-orbitron text-[9px] text-[#93c5fd]">
              {Math.round((unlocked.length / achievements.length) * 100)}%
            </p>
          </div>
          <div className="h-[3px]" style={{ backgroundColor: '#1e3a8a', borderRadius: '2px' }}>
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${(unlocked.length / achievements.length) * 100}%`,
                backgroundColor: '#fbbf24',
                borderRadius: '2px',
                boxShadow: '0 0 6px rgba(251,191,36,0.5)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Achievements */}
        <div className="space-y-4">
          {unlocked.length > 0 && (
            <SystemPanel title="Unlocked" headerColor="#92400e" delay={0}>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unlocked.map((ach, i) => (
                  <motion.div
                    key={ach.id}
                    className="p-3"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      border: '1px solid #92400e',
                      borderRadius: '2px',
                      backgroundColor: 'rgba(251, 191, 36, 0.06)',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-6 h-6 shrink-0 flex items-center justify-center mt-0.5"
                        style={{
                          border: '1px solid #fbbf2488',
                          borderRadius: '2px',
                          backgroundColor: 'rgba(251,191,36,0.15)',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                          <circle cx="12" cy="8" r="6" />
                          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-orbitron text-[10px] font-bold text-[#fbbf24]">{ach.title}</p>
                        <p className="text-[10px] text-[#64748b] mt-0.5">{ach.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </SystemPanel>
          )}

          <SystemPanel title="Locked" delay={0.1}>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {locked.map((ach, i) => (
                <motion.div
                  key={ach.id}
                  className="p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    border: '1px solid #1e3a8a',
                    borderRadius: '2px',
                    opacity: 0.5,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-6 h-6 shrink-0 flex items-center justify-center mt-0.5"
                      style={{
                        border: '1px solid #1e3a8a',
                        borderRadius: '2px',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-orbitron text-[10px] font-bold text-[#374151]">{ach.title}</p>
                      <p className="text-[10px] text-[#374151] mt-0.5">{ach.description}</p>
                      <p className="font-orbitron text-[8px] text-[#1e3a8a] mt-1 uppercase tracking-wider">
                        {conditionText(ach)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </SystemPanel>
        </div>

        {/* Titles */}
        <SystemPanel title="Titles" headerColor="#4c1d95" delay={0.1}>
          <div className="p-3 space-y-2">
            {unlockedTitles.length === 0 ? (
              <div className="py-4 text-center">
                <p className="font-orbitron text-[9px] text-[#374151] tracking-widest uppercase">
                  No Titles Unlocked
                </p>
              </div>
            ) : (
              unlockedTitles.map(title => (
                <div
                  key={title.id}
                  className="p-2.5"
                  style={{
                    border: `1px solid ${title.equipped ? '#a855f7' : '#1e3a8a'}`,
                    borderRadius: '2px',
                    backgroundColor: title.equipped ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="font-orbitron text-[10px] font-bold truncate"
                        style={{ color: title.equipped ? '#c084fc' : '#94a3b8' }}
                      >
                        {title.name}
                      </p>
                      <p className="text-[9px] text-[#64748b] mt-0.5 leading-relaxed">
                        {title.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEquipTitle(title.id)}
                      disabled={title.equipped}
                      className="shrink-0 font-orbitron text-[8px] uppercase tracking-wider px-2 py-1 transition-all"
                      style={{
                        fontFamily: 'Orbitron, monospace',
                        border: `1px solid ${title.equipped ? '#a855f7' : '#1e3a8a'}`,
                        borderRadius: '2px',
                        color: title.equipped ? '#c084fc' : '#64748b',
                        backgroundColor: title.equipped ? 'rgba(168,85,247,0.1)' : 'transparent',
                        cursor: title.equipped ? 'default' : 'pointer',
                      }}
                    >
                      {title.equipped ? 'Equipped' : 'Equip'}
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Locked titles */}
            {titles.filter(t => !t.unlockedAt).length > 0 && (
              <div className="pt-2 border-t border-[#1e3a8a]">
                <p className="font-orbitron text-[8px] text-[#374151] uppercase tracking-widest mb-2">
                  Locked
                </p>
                {titles
                  .filter(t => !t.unlockedAt)
                  .map(title => (
                    <div
                      key={title.id}
                      className="py-2"
                      style={{ opacity: 0.35, borderBottom: '1px solid #1e3a8a' }}
                    >
                      <p className="font-orbitron text-[9px] text-[#374151]">{title.name}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </SystemPanel>
      </div>
    </div>
  )
}
