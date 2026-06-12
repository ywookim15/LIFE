'use client'

import { useGameStore } from '@/lib/store'
import SystemPanel from '@/components/ui/SystemPanel'
import PartyMemberCard from '@/components/party/PartyMemberCard'
import ImportExportPanel from '@/components/party/ImportExportPanel'
import TierBadge from '@/components/ui/TierBadge'
import { getTierIndex } from '@/lib/gameLogic'

export default function PartyPage() {
  const player = useGameStore(s => s.player)
  const partyMembers = useGameStore(s => s.partyMembers)

  if (!player) return null

  // Leaderboard: self + party, sorted by totalXP
  const leaderboardEntries = [
    {
      id: player.id,
      name: player.name,
      tier: player.tier,
      level: player.level,
      totalXP: player.totalXP,
      isSelf: true,
    },
    ...partyMembers.map(m => ({
      id: m.id,
      name: m.profile.name,
      tier: m.profile.tier,
      level: m.profile.level,
      totalXP: m.profile.totalXP,
      isSelf: false,
    })),
  ].sort((a, b) => b.totalXP - a.totalXP)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="mb-2">
        <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase">
          Party System
        </p>
        <h1 className="font-orbitron text-lg font-bold text-[#93c5fd]">
          Guild Roster
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Sidebar */}
        <div className="space-y-4">
          <ImportExportPanel />

          {/* Leaderboard */}
          <SystemPanel title="Leaderboard" delay={0.1}>
            <div className="divide-y divide-[#1e3a8a]">
              {leaderboardEntries.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3"
                  style={{
                    backgroundColor: entry.isSelf ? 'rgba(59, 130, 246, 0.06)' : 'transparent',
                  }}
                >
                  <span
                    className="font-orbitron text-sm font-bold w-5 shrink-0"
                    style={{
                      color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : '#374151',
                    }}
                  >
                    {i + 1}
                  </span>
                  <TierBadge tier={entry.tier} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#e2e8f0] truncate">
                      {entry.name}
                      {entry.isSelf && (
                        <span className="font-orbitron text-[8px] text-[#3b82f6] ml-2 uppercase tracking-wider">
                          [you]
                        </span>
                      )}
                    </p>
                    <p className="font-orbitron text-[9px] text-[#64748b]">
                      Lv {entry.level}
                    </p>
                  </div>
                  <span className="font-orbitron text-[10px] text-[#fbbf24] shrink-0">
                    {entry.totalXP.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </SystemPanel>
        </div>

        {/* Party members grid */}
        <div>
          {partyMembers.length === 0 ? (
            <SystemPanel title="Party Members" delay={0.1}>
              <div className="p-8 text-center space-y-2">
                <p className="font-orbitron text-[10px] text-[#374151] tracking-widest uppercase">
                  No Party Members
                </p>
                <p className="text-xs text-[#374151] italic">
                  Import a party member's profile JSON to add them.
                </p>
              </div>
            </SystemPanel>
          ) : (
            <div>
              <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest mb-3">
                {partyMembers.length} Member{partyMembers.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {partyMembers.map(member => (
                  <PartyMemberCard key={member.id} member={member} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
