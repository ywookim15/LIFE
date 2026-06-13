'use client'

import { useGameStore } from '@/lib/store'
import CharacterCard from '@/components/dashboard/CharacterCard'
import StatGrid from '@/components/dashboard/StatGrid'
import SystemPanel from '@/components/ui/SystemPanel'
import { getTodayDate } from '@/lib/gameLogic'

export default function DashboardPage() {
  const player = useGameStore(s => s.player)
  const logs = useGameStore(s => s.logs)
  const quests = useGameStore(s => s.quests)
  const achievements = useGameStore(s => s.achievements)

  if (!player) return null

  const recentLogs = [...logs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const todayQuests = quests.filter(q => q.type === 'habit' && q.status === 'active')

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase">
            System Dashboard
          </p>
          <h1 className="font-orbitron text-lg font-bold text-[#93c5fd]">
            Status Window
          </h1>
        </div>
        <p className="font-orbitron text-[10px] text-[#374151] tracking-wider">
          {getTodayDate()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <CharacterCard />

          {todayQuests.length > 0 && (
            <SystemPanel title="Daily Objectives" delay={0.2}>
              <div className="p-3 space-y-1.5">
                {todayQuests.map(q => (
                  <div
                    key={q.id}
                    className="flex items-center gap-2 py-1.5 px-2"
                    style={{
                      border: '1px solid #1e3a8a',
                      borderRadius: '2px',
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: '#fbbf24', boxShadow: '0 0 4px #fbbf24' }}
                    />
                    <span className="text-xs text-[#e2e8f0] flex-1 truncate">{q.title}</span>
                    <span
                      className="font-orbitron text-[8px] px-1 py-0.5"
                      style={{
                        border: '1px solid #1e3a8a',
                        borderRadius: '2px',
                        color: '#64748b',
                      }}
                    >
                      {q.linkedStat}
                    </span>
                  </div>
                ))}
              </div>
            </SystemPanel>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <StatGrid />

          <SystemPanel title="System Log" delay={0.3}>
            <div className="p-3">
              {recentLogs.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="font-orbitron text-[10px] text-[#374151] tracking-wider">
                    NO LOG ENTRIES RECORDED
                  </p>
                  <p className="text-xs text-[#374151] mt-1 italic">
                    Submit your first daily log to begin evaluation.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentLogs.map(log => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 p-2"
                      style={{
                        border: '1px solid #1e3a8a',
                        borderRadius: '2px',
                        backgroundColor: 'rgba(30, 58, 138, 0.05)',
                      }}
                    >
                      <p className="font-orbitron text-[9px] text-[#64748b] shrink-0">{log.date}</p>
                      <div className="flex-1 min-w-0">
                        {log.aiEvaluation ? (
                          <p className="text-[11px] text-[#e2e8f0] truncate">
                            {log.aiEvaluation.systemMessage}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#64748b] italic">Pending evaluation</p>
                        )}
                      </div>
                      {log.aiEvaluation && (
                        <div
                          className="shrink-0 px-2 py-0.5 font-orbitron text-[10px]"
                          style={{
                            color: '#fbbf24',
                            border: '1px solid #92400e',
                            borderRadius: '2px',
                          }}
                        >
                          +{log.aiEvaluation.xpAwarded}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SystemPanel>
        </div>
      </div>
    </div>
  )
}
