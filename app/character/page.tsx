'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import SystemPanel from '@/components/ui/SystemPanel'
import StatHistoryChart from '@/components/charts/StatHistoryChart'
import { ALL_STAT_KEYS, getStatColor, getStatLabel, formatTimestamp } from '@/lib/gameLogic'

type Tab = 'summary' | 'history'

interface CharacterSummaryData {
  characterAssessment: string
  weeklyTrajectory: string
  systemDirective: string
  generatedAt: string
}

export default function CharacterPage() {
  const player = useGameStore(s => s.player)
  const logs = useGameStore(s => s.logs)
  const quests = useGameStore(s => s.quests)

  const [tab, setTab] = useState<Tab>('summary')
  const [summary, setSummary] = useState<CharacterSummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSummary = useCallback(async () => {
    if (!player) return
    setLoading(true)
    setError(null)

    const recentLogs = [...logs]
      .filter(l => l.aiEvaluation)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14)
      .map(l => ({
        date: l.date,
        xpAwarded: l.aiEvaluation!.xpAwarded,
        systemMessage: l.aiEvaluation!.systemMessage,
      }))

    const activeQuests = quests
      .filter(q => q.status === 'active')
      .map(q => ({ title: q.title, type: q.type, linkedStat: q.linkedStat, streak: q.streak }))

    try {
      const res = await fetch('/api/character-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: player.name,
          tier: player.tier,
          level: player.level,
          totalXP: player.totalXP,
          stats: Object.fromEntries(
            ALL_STAT_KEYS.map(k => [k, {
              value: player.stats[k].value,
              subStats: player.stats[k].subStats.map(ss => ({ name: ss.name, value: ss.value })),
            }])
          ),
          recentLogs,
          statHistory30d: (player.statHistory ?? []).slice(-30),
          activeQuests,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed')
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary.')
    } finally {
      setLoading(false)
    }
  }, [player, logs, quests])

  if (!player) return null

  const history = player.statHistory ?? []

  const snapshots30d = history.slice(-30)
  const snap7dAgo = snapshots30d.length >= 7 ? snapshots30d[snapshots30d.length - 7] : null
  const snapNow = snapshots30d[snapshots30d.length - 1]

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="mb-2">
        <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase">
          Character System
        </p>
        <h1 className="font-orbitron text-lg font-bold text-[#93c5fd]">
          Character Profile
        </h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {(['summary', 'history'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 font-orbitron text-[10px] uppercase tracking-wider transition-all"
            style={{
              border: `1px solid ${tab === t ? '#3b82f6' : '#1e3a8a'}`,
              borderRadius: '2px',
              backgroundColor: tab === t ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: tab === t ? '#93c5fd' : '#64748b',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="space-y-4">
          {/* AI Summary */}
          <SystemPanel title="AI Character Summary" delay={0}>
            <div className="p-4 space-y-4">
              {summary ? (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <SummarySection
                    label="Character Assessment"
                    text={summary.characterAssessment}
                    color="#93c5fd"
                  />
                  <SummarySection
                    label="Weekly Trajectory"
                    text={summary.weeklyTrajectory}
                    color="#fbbf24"
                  />
                  <SummarySection
                    label="System Directive"
                    text={summary.systemDirective}
                    color="#ec4899"
                  />
                  <p className="text-[9px] text-[#374151] mt-2">
                    Generated: {formatTimestamp(summary.generatedAt)}
                  </p>
                </motion.div>
              ) : (
                <div className="py-4 text-center space-y-3">
                  <p className="font-orbitron text-[10px] text-[#374151] tracking-wider uppercase">
                    No summary generated
                  </p>
                  <p className="text-[11px] text-[#374151]">
                    Generate an AI analysis of your character's current state, weekly trajectory, and tactical directive.
                  </p>
                </div>
              )}

              {error && (
                <div
                  className="p-3 font-orbitron text-[10px] text-[#ef4444]"
                  style={{ border: '1px solid #7f1d1d', borderRadius: '2px' }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={generateSummary}
                disabled={loading}
                className="w-full py-2.5 font-orbitron text-[10px] uppercase tracking-wider transition-all"
                style={{
                  border: `1px solid ${loading ? '#1e3a8a' : '#3b82f6'}`,
                  borderRadius: '2px',
                  background: loading ? 'transparent' : 'rgba(59,130,246,0.2)',
                  color: loading ? '#374151' : '#93c5fd',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border border-[#1e3a8a] border-t-[#3b82f6] rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : summary ? 'Regenerate Analysis' : 'Generate Character Analysis'}
              </button>
            </div>
          </SystemPanel>

          {/* 7-day stat delta */}
          {snap7dAgo && snapNow && (
            <SystemPanel title="7-Day Stat Changes" delay={0.1}>
              <div className="p-3 grid grid-cols-5 gap-2">
                {ALL_STAT_KEYS.map(stat => {
                  const prev = snap7dAgo.stats[stat] ?? 0
                  const curr = snapNow.stats[stat] ?? 0
                  const delta = curr - prev
                  const color = getStatColor(stat)
                  return (
                    <div key={stat} className="text-center space-y-1">
                      <p className="font-orbitron text-[10px] font-bold" style={{ color }}>{stat}</p>
                      <p className="font-orbitron text-lg font-black" style={{ color: '#93c5fd' }}>{curr}</p>
                      <p
                        className="font-orbitron text-[10px]"
                        style={{ color: delta > 0 ? '#4fffb0' : delta < 0 ? '#ef4444' : '#374151' }}
                      >
                        {delta > 0 ? `+${delta}` : delta === 0 ? '—' : delta}
                      </p>
                    </div>
                  )
                })}
              </div>
            </SystemPanel>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <SystemPanel title="Stat History — Last 30 Days" delay={0}>
            <div className="p-4">
              <StatHistoryChart history={history} />
            </div>
          </SystemPanel>

          {history.length > 0 && (
            <SystemPanel title="Snapshots" delay={0.1}>
              <div className="divide-y divide-[#1e3a8a] max-h-64 overflow-y-auto">
                {[...history].reverse().slice(0, 20).map(snap => (
                  <div key={snap.date} className="p-2.5 flex items-center gap-3">
                    <span className="font-orbitron text-[9px] text-[#64748b] shrink-0 w-20">{snap.date}</span>
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      {ALL_STAT_KEYS.map(k => (
                        <span key={k} className="font-orbitron text-[9px]" style={{ color: getStatColor(k) }}>
                          {k}:{snap.stats[k]}
                        </span>
                      ))}
                    </div>
                    <span className="font-orbitron text-[9px] text-[#374151] shrink-0">
                      Lv.{snap.level}
                    </span>
                  </div>
                ))}
              </div>
            </SystemPanel>
          )}
        </div>
      )}
    </div>
  )
}

function SummarySection({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <div
      className="p-3 space-y-1.5"
      style={{
        border: `1px solid ${color}22`,
        borderRadius: '2px',
        backgroundColor: `${color}06`,
      }}
    >
      <p className="font-orbitron text-[9px] uppercase tracking-widest" style={{ color: `${color}88` }}>
        {label}
      </p>
      <p className="text-[11px] leading-relaxed" style={{ color: '#e2e8f0' }}>
        {text}
      </p>
    </div>
  )
}
