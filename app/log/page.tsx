'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'
import SystemPanel from '@/components/ui/SystemPanel'
import LogEditor from '@/components/log/LogEditor'
import EvaluationResult from '@/components/log/EvaluationResult'
import { AIEvaluation, DailyLog } from '@/lib/types'
import { getTodayDate, formatDate, ALL_STAT_KEYS } from '@/lib/gameLogic'

export default function LogPage() {
  const player = useGameStore(s => s.player)
  const logs = useGameStore(s => s.logs)
  const updateLogEvaluation = useGameStore(s => s.updateLogEvaluation)
  const checkAchievements = useGameStore(s => s.checkAndUnlockAchievements)
  const { notify } = useNotification()

  const [currentLogId, setCurrentLogId] = useState<string | null>(null)
  const [retryLoading, setRetryLoading] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  if (!player) return null

  const today = getTodayDate()
  const todayLog = logs.find(l => l.date === today)
  const pastLogs = [...logs]
    .filter(l => l.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date))

  const handleEvaluationComplete = (logId: string, evaluation: AIEvaluation) => {
    updateLogEvaluation(logId, evaluation)
    setCurrentLogId(logId)

    notify(`EVALUATION COMPLETE. +${evaluation.xpAwarded} XP AWARDED.`, 'success')

    const unlocked = checkAchievements()
    unlocked.forEach(id => {
      const ach = useGameStore.getState().achievements.find(a => a.id === id)
      if (ach) notify(`ACHIEVEMENT UNLOCKED: ${ach.title}`, 'info')
    })
  }

  const runEvaluationForLog = async (log: DailyLog) => {
    if (!player) return
    setRetryLoading(true)
    setRetryError(null)

    const allSubStats = ALL_STAT_KEYS.flatMap(k =>
      player.stats[k].subStats.map(ss => ({
        id: ss.id, name: ss.name, value: ss.value, parentStat: ss.parentStat,
      }))
    )

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerStats: player.stats,
          questList: 'No daily quests data available for retry.',
          logContent: log.content,
          subStats: allSubStats,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Evaluation failed')
      const evaluation: AIEvaluation = {
        xpAwarded: data.totalXP,
        statBreakdown: data.statBreakdown,
        subStatUpdates: data.subStatUpdates,
        systemMessage: data.systemMessage,
        evaluatedAt: new Date().toISOString(),
      }
      handleEvaluationComplete(log.id, evaluation)
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Evaluation failed. Check your GEMINI_API_KEY in .env.local.')
    } finally {
      setRetryLoading(false)
    }
  }

  const displayLog = currentLogId
    ? logs.find(l => l.id === currentLogId)
    : todayLog

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="mb-2">
        <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase">
          Daily Log System
        </p>
        <h1 className="font-orbitron text-lg font-bold text-[#93c5fd]">
          Activity Report
        </h1>
      </div>

      {/* Today's log */}
      <SystemPanel title="Today's Evaluation" delay={0}>
        <div className="p-4">
          {displayLog?.aiEvaluation ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-orbitron text-[10px] text-[#4fffb0] tracking-wider uppercase">
                  Evaluation Complete
                </p>
                <p className="font-orbitron text-[9px] text-[#64748b]">{today}</p>
              </div>
              <EvaluationResult log={displayLog} />
            </div>
          ) : todayLog && !todayLog.aiEvaluation ? (
            <div className="space-y-3">
              <p className="font-orbitron text-[10px] text-[#fbbf24] tracking-wider uppercase animate-pulse">
                Awaiting Evaluation
              </p>
              <div
                className="p-3 text-[11px] text-[#64748b] leading-relaxed max-h-32 overflow-y-auto"
                style={{ border: '1px solid #1e3a8a', borderRadius: '2px', backgroundColor: 'rgba(30,58,138,0.05)' }}
              >
                {todayLog.content}
              </div>
              {retryError && (
                <div
                  className="p-3 font-orbitron text-[10px] text-[#ef4444]"
                  style={{ border: '1px solid #7f1d1d', borderRadius: '2px' }}
                >
                  {retryError}
                </div>
              )}
              <button
                onClick={() => runEvaluationForLog(todayLog)}
                disabled={retryLoading}
                className="w-full py-2.5 font-orbitron text-[10px] uppercase tracking-wider transition-all"
                style={{
                  border: `1px solid ${retryLoading ? '#1e3a8a' : '#fbbf24'}`,
                  borderRadius: '2px',
                  background: retryLoading ? 'transparent' : 'rgba(251,191,36,0.1)',
                  color: retryLoading ? '#374151' : '#fbbf24',
                  cursor: retryLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {retryLoading ? 'Running Evaluation...' : 'Run Evaluation Now'}
              </button>
            </div>
          ) : (
            <LogEditor onEvaluationComplete={handleEvaluationComplete} />
          )}
        </div>
      </SystemPanel>

      {/* Past logs */}
      {pastLogs.length > 0 && (
        <SystemPanel title="Past Logs" delay={0.15}>
          <div className="divide-y divide-[#1e3a8a]">
            {pastLogs.slice(0, 10).map(log => (
              <div
                key={log.id}
                className="p-3 flex items-start gap-3"
              >
                <div className="shrink-0 text-right">
                  <p className="font-orbitron text-[9px] text-[#64748b]">{formatDate(log.date)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  {log.aiEvaluation ? (
                    <>
                      <p className="text-[11px] text-[#e2e8f0] truncate mb-1">
                        {log.aiEvaluation.systemMessage}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-orbitron text-[9px] px-1.5 py-0.5"
                          style={{
                            color: '#fbbf24',
                            border: '1px solid #92400e',
                            borderRadius: '2px',
                          }}
                        >
                          +{log.aiEvaluation.xpAwarded} XP
                        </span>
                        {log.questsCompleted.length > 0 && (
                          <span
                            className="font-orbitron text-[9px] px-1.5 py-0.5"
                            style={{
                              color: '#4fffb0',
                              border: '1px solid #064e3b',
                              borderRadius: '2px',
                            }}
                          >
                            {log.questsCompleted.length} quests
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-[#374151] italic">No evaluation</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SystemPanel>
      )}
    </div>
  )
}
