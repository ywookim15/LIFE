'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import SystemPanel from '@/components/ui/SystemPanel'
import QuestCard from '@/components/quests/QuestCard'
import QuestForm from '@/components/quests/QuestForm'
import { Quest } from '@/lib/types'

type QuestType = Quest['type']

interface SectionConfig {
  type: QuestType
  label: string
  subtitle: string
  color: string
}

const SECTIONS: SectionConfig[] = [
  {
    type: 'habit',
    label: 'Daily Habits',
    subtitle: 'Recurring behaviors you commit to every single day. Auto-reset at midnight.',
    color: '#3b82f6',
  },
  {
    type: 'today',
    label: "Today's Quests",
    subtitle: 'Tasks and objectives due to be completed today.',
    color: '#a855f7',
  },
  {
    type: 'weekly',
    label: "This Week",
    subtitle: 'Weekly objectives that move the needle on your goals.',
    color: '#f97316',
  },
  {
    type: 'yearly',
    label: "This Year",
    subtitle: 'Long-term goals and major milestones. The battles that define your arc.',
    color: '#fbbf24',
  },
  {
    type: 'lifePurpose',
    label: 'Life Purpose',
    subtitle: 'Your defining missions. Sequential milestones — complete them in order.',
    color: '#ec4899',
  },
]

export default function QuestsPage() {
  const quests = useGameStore(s => s.quests)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<QuestType>('habit')

  const getQuests = (type: QuestType, status?: Quest['status']) => {
    return quests.filter(q =>
      q.type === type && (status ? q.status === status : true)
    )
  }

  const openForm = (type: QuestType) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SECTIONS.map((section, idx) => (
          <QuestSection
            key={section.type}
            config={section}
            activeQuests={getQuests(section.type, 'active')}
            completedQuests={getQuests(section.type, 'completed')}
            failedQuests={getQuests(section.type, 'failed')}
            onAddQuest={() => openForm(section.type)}
            delay={idx * 0.05}
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

interface QuestSectionProps {
  config: SectionConfig
  activeQuests: Quest[]
  completedQuests: Quest[]
  failedQuests: Quest[]
  onAddQuest: () => void
  delay: number
}

function QuestSection({
  config,
  activeQuests,
  completedQuests,
  failedQuests,
  onAddQuest,
  delay,
}: QuestSectionProps) {
  const [showHistory, setShowHistory] = useState(false)
  const { type, label, subtitle, color } = config

  const addLabel = () => {
    switch (type) {
      case 'habit': return 'ADD HABIT'
      case 'today': return "ADD TODAY'S QUEST"
      case 'weekly': return 'ADD WEEKLY QUEST'
      case 'yearly': return 'ADD YEARLY QUEST'
      case 'lifePurpose': return 'ADD LIFE PURPOSE'
    }
  }

  return (
    <SystemPanel
      title={label.toUpperCase()}
      headerColor={color}
      delay={delay}
    >
      <div className="p-3 space-y-3">
        <p className="font-orbitron text-[9px] text-[#475569] tracking-wider leading-relaxed uppercase">
          {subtitle}
        </p>

        <div className="space-y-2">
          <AnimatePresence>
            {activeQuests.length === 0 && (
              <div className="py-3 text-center">
                <p className="font-orbitron text-[10px] text-[#374151] tracking-wider">
                  NO ACTIVE {label.toUpperCase()}
                </p>
              </div>
            )}
            {activeQuests.map(q => (
              <QuestCard key={q.id} quest={q} defaultType={type} />
            ))}
          </AnimatePresence>
        </div>

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
            e.currentTarget.style.borderColor = color
            e.currentTarget.style.color = color
            e.currentTarget.style.backgroundColor = `${color}11`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = `${color}44`
            e.currentTarget.style.color = `${color}88`
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          + {addLabel()}
        </button>

        {(completedQuests.length > 0 || failedQuests.length > 0) && (
          <div>
            <button
              onClick={() => setShowHistory(s => !s)}
              className="w-full text-left font-orbitron text-[9px] text-[#64748b] py-1 uppercase tracking-wider"
            >
              {showHistory ? '▼' : '▶'} History ({completedQuests.length + failedQuests.length})
            </button>
            {showHistory && (
              <div className="space-y-2 mt-2">
                {[...completedQuests, ...failedQuests]
                  .sort((a, b) => (b.completedAt || b.createdAt).localeCompare(a.completedAt || a.createdAt))
                  .slice(0, 5)
                  .map(q => (
                    <QuestCard key={q.id} quest={q} defaultType={type} />
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
