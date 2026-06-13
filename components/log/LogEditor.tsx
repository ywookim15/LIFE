'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'
import { getTodayDate, ALL_STAT_KEYS } from '@/lib/gameLogic'
import { AIEvaluation } from '@/lib/types'

interface LogEditorProps {
  onEvaluationComplete: (logId: string, evaluation: AIEvaluation) => void
}

export default function LogEditor({ onEvaluationComplete }: LogEditorProps) {
  const player = useGameStore(s => s.player)
  const quests = useGameStore(s => s.quests)
  const submitLog = useGameStore(s => s.submitLog)
  const { notify } = useNotification()

  const [content, setContent] = useState('')
  const [checkedQuests, setCheckedQuests] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = getTodayDate()
  const todayDailyQuests = quests.filter(q => q.type === 'habit' && q.status === 'active')

  const toggleQuest = (id: string) => {
    setCheckedQuests(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!content.trim() || !player) return
    setLoading(true)
    setError(null)

    const completedIds = Array.from(checkedQuests)

    const questList = todayDailyQuests
      .map(q => `- "${q.title}" [${q.linkedStat}]: ${checkedQuests.has(q.id) ? 'COMPLETED' : 'NOT COMPLETED'}`)
      .join('\n') || 'No daily quests assigned today.'

    const allSubStats = ALL_STAT_KEYS.flatMap(k =>
      player.stats[k].subStats.map(ss => ({
        id: ss.id,
        name: ss.name,
        value: ss.value,
        parentStat: ss.parentStat,
      }))
    )

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerStats: player.stats,
          questList,
          logContent: content,
          subStats: allSubStats,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Evaluation failed')
      }

      // Submit log only after successful evaluation so errors remain visible
      const log = submitLog(content, completedIds)

      const evaluation: AIEvaluation = {
        xpAwarded: data.totalXP,
        statBreakdown: data.statBreakdown,
        subStatUpdates: data.subStatUpdates,
        systemMessage: data.systemMessage,
        evaluatedAt: new Date().toISOString(),
      }

      onEvaluationComplete(log.id, evaluation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed. Check your GEMINI_API_KEY in .env.local.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div
          className="w-10 h-10 border-2 border-[#1e3a8a] border-t-[#3b82f6] rounded-full animate-spin"
        />
        <p className="font-orbitron text-[10px] text-[#3b82f6] tracking-[0.4em] uppercase animate-pulse">
          System Processing...
        </p>
        <p className="text-[11px] text-[#374151]">The System is evaluating your progress.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Date header */}
      <div className="flex items-center gap-3">
        <div
          className="px-2 py-1 font-orbitron text-[10px] text-[#3b82f6] tracking-widest"
          style={{
            border: '1px solid #1e3a8a',
            borderRadius: '2px',
            backgroundColor: 'rgba(30, 58, 138, 0.1)',
          }}
        >
          {today}
        </div>
        <span className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-wider">
          Daily Evaluation
        </span>
      </div>

      {/* Daily quest checklist */}
      {todayDailyQuests.length > 0 && (
        <div className="space-y-2">
          <p className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest">
            Daily Quests — Mark Completed
          </p>
          <div className="space-y-1.5">
            {todayDailyQuests.map(q => (
              <label
                key={q.id}
                className="flex items-center gap-3 p-2 cursor-pointer transition-all"
                style={{
                  border: `1px solid ${checkedQuests.has(q.id) ? '#064e3b' : '#1e3a8a'}`,
                  borderRadius: '2px',
                  backgroundColor: checkedQuests.has(q.id) ? 'rgba(6, 78, 59, 0.1)' : 'transparent',
                }}
              >
                <div
                  className="w-4 h-4 flex items-center justify-center shrink-0"
                  style={{
                    border: `1px solid ${checkedQuests.has(q.id) ? '#4fffb0' : '#1e3a8a'}`,
                    borderRadius: '2px',
                    backgroundColor: checkedQuests.has(q.id) ? 'rgba(79,255,176,0.2)' : 'transparent',
                  }}
                >
                  {checkedQuests.has(q.id) && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5 4-4" stroke="#4fffb0" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={checkedQuests.has(q.id)}
                  onChange={() => toggleQuest(q.id)}
                  className="sr-only"
                />
                <span className="text-xs flex-1" style={{ color: checkedQuests.has(q.id) ? '#4fffb0' : '#94a3b8' }}>
                  {q.title}
                </span>
                <span
                  className="font-orbitron text-[8px] px-1"
                  style={{
                    color: '#64748b',
                    border: '1px solid #1e3a8a',
                    borderRadius: '2px',
                  }}
                >
                  {q.linkedStat}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Log content */}
      <div className="space-y-1.5">
        <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
          Activity Report
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="textarea-system"
          placeholder="Report your activity to the System. Be specific — the System rewards detail and punishes vagueness. What did you do? How hard did you work? What did you improve?"
          rows={8}
        />
        <p className="text-[10px] text-[#374151]">
          {content.length} chars — more detail = better evaluation
        </p>
      </div>

      {error && (
        <div
          className="p-3 font-orbitron text-[10px] text-[#ef4444] tracking-wider"
          style={{
            border: '1px solid #7f1d1d',
            borderRadius: '2px',
            backgroundColor: 'rgba(127, 29, 29, 0.1)',
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!content.trim()}
        className="w-full py-3 font-orbitron text-[11px] uppercase tracking-[0.2em] transition-all"
        style={{
          fontFamily: 'Orbitron, monospace',
          background: content.trim()
            ? 'rgba(59, 130, 246, 0.25)'
            : 'rgba(30, 58, 138, 0.1)',
          border: `1px solid ${content.trim() ? '#3b82f6' : '#1e3a8a'}`,
          color: content.trim() ? '#93c5fd' : '#374151',
          cursor: content.trim() ? 'pointer' : 'not-allowed',
          borderRadius: '2px',
          boxShadow: content.trim() ? '0 0 15px rgba(59,130,246,0.2)' : 'none',
        }}
      >
        SUBMIT FOR EVALUATION
      </button>
    </div>
  )
}
