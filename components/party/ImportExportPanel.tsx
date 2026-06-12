'use client'

import { useRef } from 'react'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'
import { PartyMember } from '@/lib/types'
import SystemPanel from '@/components/ui/SystemPanel'

export default function ImportExportPanel() {
  const exportProfile = useGameStore(s => s.exportProfile)
  const addPartyMember = useGameStore(s => s.addPartyMember)
  const { notify } = useNotification()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = exportProfile()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lifegame-profile-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    notify('PROFILE EXPORTED. Share with party members.', 'success')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const raw = evt.target?.result as string
        const data = JSON.parse(raw)

        if (!data.profile || !data.name) {
          throw new Error('Invalid profile format')
        }

        const member: PartyMember = {
          id: data.id || data.profile.id,
          name: data.name,
          profile: data.profile,
          quests: data.quests || [],
          achievements: data.achievements || [],
          titles: data.titles || [],
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        }

        addPartyMember(member)
        notify(`PARTY MEMBER ADDED: ${member.name}`, 'success')
      } catch {
        notify('SYSTEM ERROR: Invalid profile file.', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <SystemPanel title="Data Exchange" delay={0.05}>
      <div className="p-4 space-y-3">
        <p className="text-[11px] text-[#64748b] leading-relaxed">
          Export your profile as JSON to share with party members. Import their profile JSON to add them to your party.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleExport}
            className="flex-1 py-3 font-orbitron text-[10px] uppercase tracking-widest transition-all"
            style={{
              fontFamily: 'Orbitron, monospace',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid #1e3a8a',
              color: '#93c5fd',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#3b82f6'
              e.currentTarget.style.boxShadow = '0 0 10px rgba(59,130,246,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#1e3a8a'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Export Profile
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 font-orbitron text-[10px] uppercase tracking-widest transition-all"
            style={{
              fontFamily: 'Orbitron, monospace',
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid #4c1d95',
              color: '#c084fc',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#a855f7'
              e.currentTarget.style.boxShadow = '0 0 10px rgba(168,85,247,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#4c1d95'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Import Profile
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="sr-only"
        />
      </div>
    </SystemPanel>
  )
}
