'use client'

import { useState } from 'react'
import { StatKey } from '@/lib/types'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'

interface AddSubStatFormProps {
  defaultStat?: StatKey
  onClose: () => void
}

export default function AddSubStatForm({ defaultStat = 'INT', onClose }: AddSubStatFormProps) {
  const [name, setName] = useState('')
  const addSubStat = useGameStore(s => s.addSubStat)
  const { notify } = useNotification()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addSubStat(defaultStat, name.trim())
    notify(`SUB-STAT ADDED: ${name.trim()} [${defaultStat}]`, 'success')
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        className="input-system flex-1 text-sm"
        placeholder="Sub-stat name..."
        autoFocus
        maxLength={32}
      />
      <button
        type="submit"
        disabled={!name.trim()}
        style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '9px',
          letterSpacing: '0.1em',
          background: name.trim() ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 58, 138, 0.1)',
          border: `1px solid ${name.trim() ? '#3b82f6' : '#1e3a8a'}`,
          color: name.trim() ? '#93c5fd' : '#374151',
          cursor: name.trim() ? 'pointer' : 'not-allowed',
          borderRadius: '2px',
          padding: '6px 10px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        ADD
      </button>
      <button
        type="button"
        onClick={onClose}
        style={{ color: '#64748b', padding: '0 4px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </form>
  )
}
