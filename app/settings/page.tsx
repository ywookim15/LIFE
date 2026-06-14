'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import SystemPanel from '@/components/ui/SystemPanel'
import TierBadge from '@/components/ui/TierBadge'
import { getDaysActive } from '@/lib/gameLogic'
import { STAT_PALETTE } from '@/lib/defaultData'
import type { StatConfig } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { FONT_OPTIONS } from '@/contexts/ThemeContext'

export default function SettingsPage() {
  const player = useGameStore(s => s.player)
  const statConfig = useGameStore(s => s.statConfig)
  const updatePlayerName = useGameStore(s => s.updatePlayerName)
  const resetGame = useGameStore(s => s.resetGame)
  const addStat = useGameStore(s => s.addStat)
  const deleteStat = useGameStore(s => s.deleteStat)
  const updateStatConfig = useGameStore(s => s.updateStatConfig)
  const logs = useGameStore(s => s.logs)
  const quests = useGameStore(s => s.quests)
  const { notify } = useNotification()
  const { user, signOut, deleteAccount } = useAuth()
  const { isDark, toggleTheme, fontId, setFont } = useTheme()

  const [newName, setNewName] = useState(player?.name || '')
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [signOutLoading, setSignOutLoading] = useState(false)
  const [showPwForm, setShowPwForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  // Skills management state
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('')
  const [newStatLabel, setNewStatLabel] = useState('')
  const [newStatDesc, setNewStatDesc] = useState('')
  const [newStatColor, setNewStatColor] = useState(STAT_PALETTE[0])
  const [confirmDeleteStat, setConfirmDeleteStat] = useState<string | null>(null)

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
    notify('SYSTEM RESET. XP and history cleared.', 'error')
    setConfirmReset(false)
    setConfirmText('')
  }

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword !== confirmPassword) return
    if (newPassword.length < 8) { notify('Password must be at least 8 characters.', 'error'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)
    if (error) { notify(`Error: ${error.message}`, 'error') }
    else {
      notify('PASSWORD UPDATED SUCCESSFULLY.', 'success')
      setNewPassword(''); setConfirmPassword(''); setShowPwForm(false)
    }
  }

  const handleSignOut = async () => {
    setSignOutLoading(true)
    await signOut()
  }

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') return
    setDeleteLoading(true)
    const err = await deleteAccount()
    if (err) {
      notify(`Error: ${err}`, 'error')
      setDeleteLoading(false)
    }
  }

  const startEdit = (cfg: StatConfig) => {
    setEditingKey(cfg.key)
    setEditLabel(cfg.label)
    setEditDescription(cfg.description)
    setEditColor(cfg.color)
  }

  const saveEdit = () => {
    if (!editingKey || !editLabel.trim()) return
    updateStatConfig(editingKey, {
      label: editLabel.trim(),
      description: editDescription.trim(),
      color: editColor,
    })
    notify('SKILL UPDATED.', 'success')
    setEditingKey(null)
  }

  const handleAddStat = () => {
    if (!newStatLabel.trim()) return
    addStat({ label: newStatLabel.trim(), description: newStatDesc.trim(), color: newStatColor })
    notify(`SKILL "${newStatLabel.trim().toUpperCase()}" ADDED.`, 'success')
    setNewStatLabel('')
    setNewStatDesc('')
    setNewStatColor(STAT_PALETTE[statConfig.length % STAT_PALETTE.length])
  }

  const handleDeleteStat = (key: string) => {
    deleteStat(key)
    notify('SKILL DELETED.', 'error')
    setConfirmDeleteStat(null)
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
                  border: '1px solid var(--border-primary)',
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

      {/* Display */}
      <SystemPanel title="Display" delay={0.03}>
        <div className="p-4 space-y-4">
          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest mb-0.5">Theme</p>
              <p className="text-xs text-[#e2e8f0]">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative w-12 h-6 rounded-full transition-colors duration-300"
              style={{ background: isDark ? 'rgba(30,58,138,0.5)' : '#3b82f6', border: `1px solid ${isDark ? '#1e3a8a' : '#2563eb'}` }}
            >
              <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
                style={{ left: isDark ? '2px' : '22px', background: isDark ? '#374151' : '#ffffff', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>

          {/* Font selector */}
          <div>
            <p className="font-orbitron text-[10px] text-[#64748b] uppercase tracking-widest mb-2">UI Font</p>
            <select
              value={fontId}
              onChange={e => setFont(e.target.value)}
              className="select-system w-full"
            >
              {FONT_OPTIONS.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
            <p className="font-orbitron text-[8px] text-[#374151] mt-1.5">
              Changes the body text font. Orbitron display font remains unchanged.
            </p>
          </div>
        </div>
      </SystemPanel>

      {/* Skills management */}
      <SystemPanel title="Skills Configuration" delay={0.06}>
        <div className="p-4 space-y-4">
          <p className="text-[11px] text-[#64748b]">
            Rename, recolor, add, or remove core skills. Deleting a skill removes all its sub-skills and associated XP.
          </p>

          {/* Existing stats */}
          <div className="space-y-2">
            {statConfig.map(cfg => (
              <div key={cfg.key}>
                {editingKey === cfg.key ? (
                  <div
                    className="p-3 space-y-2"
                    style={{ border: `1px solid ${cfg.color}`, borderRadius: '2px', background: 'rgba(30,58,138,0.1)' }}
                  >
                    <div className="flex gap-2">
                      <input
                        className="input-system text-sm flex-1"
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        placeholder="Skill name"
                        maxLength={24}
                      />
                      <div className="relative shrink-0">
                        <input
                          type="color"
                          value={editColor}
                          onChange={e => setEditColor(e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div
                          className="w-10 h-10 rounded border cursor-pointer"
                          style={{ background: editColor, border: `2px solid ${editColor}` }}
                        />
                      </div>
                    </div>
                    <input
                      className="input-system text-xs"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                      maxLength={80}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setEditingKey(null)} className="btn-system flex-1 py-1.5 text-[9px]">Cancel</button>
                      <button onClick={saveEdit} className="btn-system flex-1 py-1.5 text-[9px] btn-system-success">Save</button>
                    </div>
                  </div>
                ) : confirmDeleteStat === cfg.key ? (
                  <div
                    className="p-3 space-y-2"
                    style={{ border: '1px solid #7f1d1d', borderRadius: '2px', background: 'rgba(127,29,29,0.1)' }}
                  >
                    <p className="font-orbitron text-[10px] text-[#ef4444] uppercase">
                      Delete &quot;{cfg.label}&quot;? This removes all sub-skills.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDeleteStat(null)} className="btn-system flex-1 py-1.5 text-[9px]">Cancel</button>
                      <button onClick={() => handleDeleteStat(cfg.key)} className="btn-system btn-system-danger flex-1 py-1.5 text-[9px]">Delete</button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 p-2.5"
                    style={{ border: '1px solid var(--border-primary)', borderRadius: '2px' }}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-orbitron text-xs text-[#e2e8f0]">{cfg.label}</p>
                      {cfg.description && (
                        <p className="text-[10px] text-[#64748b] truncate">{cfg.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(cfg)}
                        className="px-2 py-1 font-orbitron text-[8px] uppercase tracking-wider transition-all"
                        style={{ border: '1px solid #1e3a8a', borderRadius: '2px', color: '#93c5fd', background: 'transparent', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteStat(cfg.key)}
                        className="px-2 py-1 font-orbitron text-[8px] uppercase tracking-wider transition-all"
                        style={{ border: '1px solid #7f1d1d', borderRadius: '2px', color: '#ef4444', background: 'transparent', cursor: 'pointer' }}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add new stat */}
          <div
            className="p-3 space-y-2"
            style={{ border: '1px dashed #1e3a8a', borderRadius: '2px', background: 'rgba(30,58,138,0.05)' }}
          >
            <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">Add New Skill</p>
            <div className="flex gap-2">
              <input
                className="input-system text-sm flex-1"
                value={newStatLabel}
                onChange={e => setNewStatLabel(e.target.value)}
                placeholder="Skill name (e.g. Creativity)"
                maxLength={24}
              />
              <div className="relative shrink-0">
                <input
                  type="color"
                  value={newStatColor}
                  onChange={e => setNewStatColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ background: newStatColor, border: `2px solid ${newStatColor}` }}
                />
              </div>
            </div>
            <input
              className="input-system text-xs"
              value={newStatDesc}
              onChange={e => setNewStatDesc(e.target.value)}
              placeholder="Description (optional)"
              maxLength={80}
            />
            <button
              onClick={handleAddStat}
              disabled={!newStatLabel.trim()}
              className="btn-system btn-system-success w-full py-2"
              style={{ opacity: newStatLabel.trim() ? 1 : 0.4, cursor: newStatLabel.trim() ? 'pointer' : 'not-allowed' }}
            >
              + Add Skill
            </button>
          </div>
        </div>
      </SystemPanel>

      {/* Player name */}
      <SystemPanel title="Player Identity" delay={0.09}>
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

      {/* Account */}
      <SystemPanel title="Account" delay={0.12}>
        <div className="p-4 space-y-3">
          <div className="p-3" style={{ border: '1px solid var(--border-primary)', borderRadius: '2px', backgroundColor: 'rgba(30, 58, 138, 0.05)' }}>
            <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest mb-1">Signed in as</p>
            <p className="font-orbitron text-xs text-[#93c5fd]">{user?.email}</p>
          </div>

          {/* Password reset */}
          {!showPwForm ? (
            <button
              onClick={() => setShowPwForm(true)}
              className="w-full py-2.5 font-orbitron text-[10px] uppercase tracking-wider transition-all"
              style={{ border: '1px solid #1e3a8a', borderRadius: '2px', background: 'transparent', color: '#93c5fd', cursor: 'pointer' }}
            >
              Change Password
            </button>
          ) : (
            <div className="space-y-2 p-3" style={{ border: '1px solid #1e3a8a', borderRadius: '2px', background: 'rgba(30,58,138,0.08)' }}>
              <p className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest">Change Password</p>
              <input
                type="password"
                className="input-system w-full"
                placeholder="New password (min 8 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                className="input-system w-full"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="font-orbitron text-[9px] text-[#ef4444]">Passwords do not match.</p>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setShowPwForm(false); setNewPassword(''); setConfirmPassword('') }}
                  className="btn-system flex-1 py-2 font-orbitron text-[9px]">Cancel</button>
                <button
                  onClick={handlePasswordReset}
                  disabled={!newPassword || newPassword !== confirmPassword || newPassword.length < 8 || pwLoading}
                  className="flex-1 py-2 font-orbitron text-[9px] uppercase tracking-wider"
                  style={{
                    border: '1px solid #3b82f6', borderRadius: '2px',
                    background: 'rgba(59,130,246,0.2)', color: '#93c5fd', cursor: 'pointer',
                    opacity: (!newPassword || newPassword !== confirmPassword || newPassword.length < 8) ? 0.4 : 1,
                  }}
                >
                  {pwLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="w-full py-2.5 font-orbitron text-[10px] uppercase tracking-wider transition-all"
            style={{ border: '1px solid var(--border-primary)', borderRadius: '2px', background: 'transparent', color: signOutLoading ? '#374151' : '#64748b', cursor: signOutLoading ? 'not-allowed' : 'pointer' }}
          >
            {signOutLoading ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </SystemPanel>

      {/* Danger zone */}
      <SystemPanel title="Danger Zone" headerColor="#7f1d1d" delay={0.15}>
        <div className="p-4 space-y-4">
          <p className="text-[11px] text-[#64748b]">
            Resetting clears XP, levels, quest history, logs, and workout logs. Your skills, sub-skills, and workout plans are preserved.
          </p>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
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
              Reset Game Data
            </button>
          ) : (
            <div className="space-y-3">
              <p className="font-orbitron text-[10px] text-[#ef4444] uppercase tracking-wider">
                Type &quot;RESET&quot; to confirm:
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
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '10px',
                    background: confirmText === 'RESET' ? 'rgba(127, 29, 29, 0.4)' : 'rgba(127, 29, 29, 0.1)',
                    border: `1px solid ${confirmText === 'RESET' ? '#ef4444' : '#7f1d1d'}`,
                    color: confirmText === 'RESET' ? '#ef4444' : '#374151',
                    cursor: confirmText === 'RESET' ? 'pointer' : 'not-allowed',
                    borderRadius: '2px',
                    textTransform: 'uppercase',
                  }}
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-[#7f1d1d] pt-4 mt-2">
            <p className="text-[11px] text-[#64748b] mb-3">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  background: 'rgba(127, 29, 29, 0.1)',
                  border: '1px solid #7f1d1d',
                  color: '#ef4444',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  padding: '8px 16px',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                }}
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="font-orbitron text-[10px] text-[#ef4444] uppercase tracking-wider">
                  Type &quot;DELETE&quot; to permanently erase your account:
                </p>
                <input
                  type="text"
                  value={deleteText}
                  onChange={e => setDeleteText(e.target.value)}
                  className="input-system"
                  placeholder="Type DELETE to confirm..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setConfirmDelete(false); setDeleteText('') }}
                    className="btn-system flex-1 py-2"
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteText !== 'DELETE' || deleteLoading}
                    style={{
                      flex: 1,
                      padding: '8px',
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '10px',
                      background: deleteText === 'DELETE' ? 'rgba(127, 29, 29, 0.5)' : 'rgba(127, 29, 29, 0.1)',
                      border: `1px solid ${deleteText === 'DELETE' ? '#ef4444' : '#7f1d1d'}`,
                      color: deleteText === 'DELETE' ? '#ef4444' : '#374151',
                      cursor: deleteText === 'DELETE' && !deleteLoading ? 'pointer' : 'not-allowed',
                      borderRadius: '2px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SystemPanel>
    </div>
  )
}
