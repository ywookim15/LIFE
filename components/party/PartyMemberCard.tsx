'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PartyMember } from '@/lib/types'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'
import TierBadge from '@/components/ui/TierBadge'
import XPBar from '@/components/ui/XPBar'
import { ALL_STAT_KEYS, getStatColor, getDaysActive, formatDate } from '@/lib/gameLogic'
import SkillRadar from '@/components/skills/SkillRadar'

interface PartyMemberCardProps {
  member: PartyMember
}

export default function PartyMemberCard({ member }: PartyMemberCardProps) {
  const removePartyMember = useGameStore(s => s.removePartyMember)
  const { notify } = useNotification()
  const [showProfile, setShowProfile] = useState(false)

  const { profile } = member
  const completedQuests = member.quests.filter(q => q.status === 'completed').length
  const unlockedAchs = member.achievements.filter(a => a.unlockedAt).length

  return (
    <>
      <div
        className="panel p-4 space-y-3"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <TierBadge tier={profile.tier} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-orbitron text-sm font-bold text-[#e2e8f0] truncate">{profile.name}</p>
            {profile.title && (
              <p className="text-[10px] text-[#64748b] italic truncate">{profile.title}</p>
            )}
          </div>
          <button
            onClick={() => {
              removePartyMember(member.id)
              notify(`PARTY MEMBER REMOVED: ${member.name}`, 'info')
            }}
            style={{ color: '#374151' }}
            title="Remove member"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Level and XP */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-wider">
              Level {profile.level}
            </span>
            <span className="font-orbitron text-[9px] text-[#fbbf24]">
              {profile.totalXP.toLocaleString()} XP total
            </span>
          </div>
          <XPBar
            current={profile.xp}
            max={profile.xpToNext}
            level={profile.level}
            showValues={false}
            height={4}
            animated={false}
          />
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-1">
          {ALL_STAT_KEYS.map(stat => (
            <div
              key={stat}
              className="flex items-center justify-between px-1.5 py-1"
              style={{
                border: `1px solid ${getStatColor(stat)}33`,
                borderRadius: '2px',
              }}
            >
              <span className="font-orbitron text-[9px]" style={{ color: getStatColor(stat) }}>
                {stat}
              </span>
              <span className="font-orbitron text-[9px] text-[#93c5fd]">
                {profile.stats[stat].value}
              </span>
            </div>
          ))}
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-[9px] pt-1">
          <span className="text-[#64748b]">
            <span className="font-orbitron">{completedQuests}</span> quests
          </span>
          <span className="text-[#64748b]">
            <span className="font-orbitron">{unlockedAchs}</span> achievements
          </span>
          <span className="text-[#374151]">
            Updated {formatDate(member.lastUpdated)}
          </span>
        </div>

        <button
          onClick={() => setShowProfile(true)}
          className="btn-system w-full text-[9px] py-1.5"
        >
          VIEW PROFILE
        </button>
      </div>

      {/* Full profile modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 overflow-y-auto"
            style={{ backgroundColor: 'rgba(5, 7, 15, 0.92)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowProfile(false)}
          >
            <motion.div
              className="panel w-full max-w-2xl my-4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              <div
                className="px-4 py-3 border-b border-[#1e3a8a] flex items-center justify-between"
                style={{ backgroundColor: 'rgba(30, 58, 138, 0.2)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" style={{ boxShadow: '0 0 6px #3b82f6' }} />
                  <span className="font-orbitron text-[10px] tracking-[0.2em] text-[#93c5fd] uppercase">
                    {profile.name} — Full Profile
                  </span>
                </div>
                <button onClick={() => setShowProfile(false)} style={{ color: '#64748b' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Identity */}
                <div className="flex items-center gap-4">
                  <TierBadge tier={profile.tier} size="lg" showLabel />
                  <div>
                    <p className="font-orbitron text-xl font-bold text-[#e2e8f0]">{profile.name}</p>
                    {profile.title && <p className="text-[11px] italic text-[#64748b]">{profile.title}</p>}
                    <p className="font-orbitron text-xs text-[#fbbf24] mt-1">
                      {profile.totalXP.toLocaleString()} Total XP
                    </p>
                  </div>
                </div>

                {/* Radar */}
                <div className="border border-[#1e3a8a] p-3" style={{ borderRadius: '2px' }}>
                  <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest mb-2">
                    Skill Web
                  </p>
                  <SkillRadar player={profile} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_STAT_KEYS.map(stat => {
                    const block = profile.stats[stat]
                    const color = getStatColor(stat)
                    return (
                      <div
                        key={stat}
                        className="p-2"
                        style={{ border: `1px solid ${color}33`, borderRadius: '2px' }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-orbitron text-xs font-bold" style={{ color }}>{stat}</span>
                          <span className="font-orbitron text-sm text-[#93c5fd]">{block.value}</span>
                        </div>
                        {block.subStats.slice(0, 2).map(ss => (
                          <div key={ss.id} className="text-[9px] text-[#64748b] truncate">{ss.name}: {ss.value}</div>
                        ))}
                      </div>
                    )
                  })}
                </div>

                {/* Achievements */}
                {member.achievements.filter(a => a.unlockedAt).length > 0 && (
                  <div>
                    <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest mb-2">
                      Achievements
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {member.achievements
                        .filter(a => a.unlockedAt)
                        .map(a => (
                          <span
                            key={a.id}
                            className="font-orbitron text-[9px] px-2 py-1"
                            style={{
                              border: '1px solid #fbbf2444',
                              borderRadius: '2px',
                              color: '#fbbf24',
                              backgroundColor: 'rgba(251,191,36,0.08)',
                            }}
                          >
                            {a.title}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
