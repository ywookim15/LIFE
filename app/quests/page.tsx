'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import SystemPanel from '@/components/ui/SystemPanel'
import QuestCard from '@/components/quests/QuestCard'
import QuestForm from '@/components/quests/QuestForm'
import { Quest } from '@/lib/types'

const TABS = [
  { key: 'daily', label: 'Daily', color: '#3b82f6' },
  { key: 'side', label: 'Side', color: '#a855f7' },
  { key: 'main', label: 'Main', color: '#fbbf24' },
] as const

type TabKey = typeof TABS[number]['key']

export default function QuestsPage() {
  const quests = useGameStore(s => s.quests)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'daily' | 'side' | 'main'>('daily')
  const [mobileTab, setMobileTab] = useState<TabKey>('daily')

  const getQuests = (type: TabKey, status?: Quest['status']) => {
    return quests.filter(q =>
      q.type === type && (status ? q.status === status : true)
    )
  }

  const openForm = (type: 'daily' | 'side' | 'main') => {
    setFormType(type)
    setShowForm(true)
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase">
            Quest System
          </p>
          <h1 className="font-orbitron text-lg font-bold text-[#93c5fd]">
            Quest Board
          </h1>
        </div>
      </div>

      {/* Mobile tab selector */}
      <div className="md:hidden flex gap-2 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key)}
            className="flex-1 py-2 font-orbitron text-[10px] uppercase tracking-wider transition-all"
            style={{
              border: `1px solid ${mobileTab === tab.key ? tab.color : '#1e3a8a'}`,
              borderRadius: '2px',
              backgroundColor: mobileTab === tab.key ? `${tab.color}22` : 'transparent',
              color: mobileTab === tab.key ? tab.color : '#64748b',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop: 3 columns. Mobile: single column based on tab */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {TABS.map(tab => (
          <QuestColumn
            key={tab.key}
            type={tab.key}
            label={tab.label}
            color={tab.color}
            activeQuests={getQuests(tab.key, 'active')}
            completedQuests={getQuests(tab.key, 'completed')}
            failedQuests={getQuests(tab.key, 'failed')}
            onAddQuest={() => openForm(tab.key)}
          />
        ))}
      </div>

      {/* Mobile: single column */}
      <div className="md:hidden">
        {TABS.filter(t => t.key === mobileTab).map(tab => (
          <QuestColumn
            key={tab.key}
            type={tab.key}
            label={tab.label}
            color={tab.color}
            activeQuests={getQuests(tab.key, 'active')}
            completedQuests={getQuests(tab.key, 'completed')}
            failedQuests={getQuests(tab.key, 'failed')}
            onAddQuest={() => openForm(tab.key)}
          />
        ))}
      </div>

      {showForm && (
        <QuestForm
          defaultType={formType}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

interface QuestColumnProps {
  type: TabKey
  label: string
  color: string
  activeQuests: Quest[]
  completedQuests: Quest[]
  failedQuests: Quest[]
  onAddQuest: () => void
}

function QuestColumn({ type, label, color, activeQuests, completedQuests, failedQuests, onAddQuest }: QuestColumnProps) {
  const [showCompleted, setShowCompleted] = useState(false)

  return (
    <SystemPanel
      title={`${label} Quests`}
      headerColor={color}
      delay={0.05}
    >
      <div className="p-3 space-y-2">
        {/* Active quests */}
        <AnimatePresence>
          {activeQuests.length === 0 && (
            <div className="py-4 text-center">
              <p className="font-orbitron text-[10px] text-[#374151] tracking-wider">
                NO ACTIVE {label.toUpperCase()} QUESTS
              </p>
            </div>
          )}
          {activeQuests.map(q => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </AnimatePresence>

        {/* Add quest button */}
        <button
          onClick={onAddQuest}
          className="w-full py-2 font-orbitron text-[9px] uppercase tracking-wider transition-all"
          style={{
            border: `1px dashed ${color}44`,
            borderRadius: '2px',
            color: `${color}88`,
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.borderColor = color
            el.style.color = color
            el.style.backgroundColor = `${color}11`
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.borderColor = `${color}44`
            el.style.color = `${color}88`
            el.style.backgroundColor = 'transparent'
          }}
        >
          + ADD {label.toUpperCase()} QUEST
        </button>

        {/* Completed / failed toggle */}
        {(completedQuests.length > 0 || failedQuests.length > 0) && (
          <div>
            <button
              onClick={() => setShowCompleted(s => !s)}
              className="w-full text-left font-orbitron text-[9px] text-[#64748b] py-1 uppercase tracking-wider"
            >
              {showCompleted ? '▼' : '▶'} History ({completedQuests.length + failedQuests.length})
            </button>
            {showCompleted && (
              <div className="space-y-2 mt-2">
                {[...completedQuests, ...failedQuests]
                  .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
                  .slice(0, 5)
                  .map(q => (
                    <QuestCard key={q.id} quest={q} />
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>
    </SystemPanel>
  )
}
