'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'
import SystemPanel from '@/components/ui/SystemPanel'
import TierBadge from '@/components/ui/TierBadge'
import { getDaysActive, getTodayDate } from '@/lib/gameLogic'

export default function SettingsPage() {
  const player = useGameStore(s => s.player)
  const updatePlayerName = useGameStore(s => s.updatePlayerName)
  const resetGame = useGameStore(s => s.resetGame)
  const logs = useGameStore(s => s.logs)
  const quests = useGameStore(s => s.quests)
  const { notify } = useNotification()

  const [newName, setNewName] = useState(player?.name || '')
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  if (!player) return null

  const handleNameUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    updatePlayerName(newName.trim())
    notify('PLAYER NAME UPDATED.', 'success')
  }

  const handleReset = () => {
    if (confirmText !== 'RESET') return
    resetGame()
    notify('SYSTEM RESET. All data cleared.', 'error')
  }

  const totalSubStats = Object.values(player.stats).reduce(
    (acc, b) => acc + b.subStats.length,
    0
  )
  const completedQuests = quests.filter(q => q.status === 'completed').length
  const evaluatedLogs = logs.filter(l => l.aiEvaluation).length
  const daysActive = getDaysActive(player.createdAt)

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="mb-2">
        <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase">
          Configuration
        </p>
        <h1 className="font-orbitron text-lg font-bold text-[#93c5fd]">
          System Settings
        </h1>
      </div>

      {/* Player overview */}
      <SystemPanel title="Player Overview" delay={0}>
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <TierBadge tier={player.tier} size="lg" showLabel />
            <div>
              <p className="font-orbitron text-xl font-bold text-[#e2e8f0]">{player.name}</p>
              {player.title && (
                <p className="text-[11px] italic text-[#64748b]">{player.title}</p>
              )}
              <p className="font-orbitron text-xs text-[#fbbf24] mt-1">
                Level {player.level} — {player.totalXP.toLocaleString()} Total XP
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Days Active', value: daysActive },
              { label: 'Quests Done', value: completedQuests },
              { label: 'Skills', value: totalSubStats },
              { label: 'Evaluations', value: evaluatedLogs },
            ].map(stat => (
              <div
                key={stat.label}
                className="text-center p-2"
                style={{
                  border: '1px solid #1e3a8a',
                  borderRadius: '2px',
                  backgroundColor: 'rgba(30, 58, 138, 0.1)',
                }}
              >
                <p className="font-orbitron text-lg font-bold text-[#93c5fd]">{stat.value}</p>
                <p className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-widest mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SystemPanel>

      {/* Name update */}
      <SystemPanel title="Player Identity" delay={0.05}>
        <form onSubmit={handleNameUpdate} className="p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest block">
              Display Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="input-system"
              maxLength={32}
            />
          </div>
          <button
            type="submit"
            disabled={!newName.trim() || newName.trim() === player.name}
            className="btn-system py-2 px-4"
            style={{
              opacity: !newName.trim() || newName.trim() === player.name ? 0.4 : 1,
              cursor: !newName.trim() || newName.trim() === player.name ? 'not-allowed' : 'pointer',
            }}
          >
            Update Name
          </button>
        </form>
      </SystemPanel>

      {/* API Key info */}
      <SystemPanel title="AI Evaluation" headerColor="#4c1d95" delay={0.1}>
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-[#64748b] leading-relaxed">
            The AI evaluation system uses the Google Gemini API (free tier). Set your API key as an environment variable to enable daily log evaluation.
          </p>
          <div
            className="p-3 font-orbitron text-[10px] text-[#64748b]"
            style={{
              border: '1px solid #1e3a8a',
              borderRadius: '2px',
              backgroundColor: 'rgba(10, 15, 40, 0.5)',
            }}
          >
            <p className="text-[#93c5fd] mb-1">Environment Variable:</p>
            <p className="text-[#e2e8f0] font-mono tracking-widest">GEMINI_API_KEY</p>
            <p className="text-[#374151] mt-2 text-[9px]">
              Get a free key at aistudio.google.com. Set in Vercel project settings or .env.local.
            </p>
          </div>
          <p className="text-[10px] text-[#374151]">
            Without an API key, log submissions will fail. XP and evaluations require the AI system.
          </p>
        </div>
      </SystemPanel>

      {/* Danger zone */}
      <SystemPanel title="Danger Zone" headerColor="#7f1d1d" delay={0.15}>
        <div className="p-4 space-y-4">
          <p className="text-[11px] text-[#64748b]">
            Resetting the system will permanently delete all player data, quests, logs, and achievements. This action cannot be undone.
          </p>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="btn-system-danger py-2 px-4"
              style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '10px',
                letterSpacing: '0.1em',
                background: 'rgba(127, 29, 29, 0.2)',
                border: '1px solid #7f1d1d',
                color: '#ef4444',
                cursor: 'pointer',
                borderRadius: '2px',
                padding: '8px 16px',
                textTransform: 'uppercase',
              }}
            >
              Reset System
            </button>
          ) : (
            <div className="space-y-3">
              <p className="font-orbitron text-[10px] text-[#ef4444] uppercase tracking-wider">
                Type "RESET" to confirm destruction of all data:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                className="input-system"
                placeholder="Type RESET to confirm..."
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setConfirmReset(false); setConfirmText('') }}
                  className="btn-system flex-1 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={confirmText !== 'RESET'}
                  className="flex-1 py-2 font-orbitron text-[10px] uppercase tracking-wider"
                  style={{
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '10px',
                    background: confirmText === 'RESET' ? 'rgba(127, 29, 29, 0.4)' : 'rgba(127, 29, 29, 0.1)',
                    border: `1px solid ${confirmText === 'RESET' ? '#ef4444' : '#7f1d1d'}`,
                    color: confirmText === 'RESET' ? '#ef4444' : '#374151',
                    cursor: confirmText === 'RESET' ? 'pointer' : 'not-allowed',
                    borderRadius: '2px',
                  }}
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </SystemPanel>
    </div>
  )
}
