'use client'

import { useState, useMemo } from 'react'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'
import SystemPanel from '@/components/ui/SystemPanel'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function pad(n: number) { return String(n).padStart(2, '0') }

function dateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

export default function CalendarPage() {
  const quests = useGameStore(s => s.quests)
  const calendarEvents = useGameStore(s => s.calendarEvents)
  const addCalendarEvent = useGameStore(s => s.addCalendarEvent)
  const deleteCalendarEvent = useGameStore(s => s.deleteCalendarEvent)
  const { notify } = useNotification()

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [addingEvent, setAddingEvent] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const [evTitle, setEvTitle] = useState('')
  const [evDate, setEvDate] = useState(today.toISOString().slice(0, 10))
  const [evDesc, setEvDesc] = useState('')
  const [evColor, setEvColor] = useState('#3b82f6')

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const todayStr = today.toISOString().slice(0, 10)

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, { type: 'quest' | 'event'; id: string; title: string; color?: string }[]> = {}
    for (const q of quests) {
      if (q.dueDate) {
        if (!map[q.dueDate]) map[q.dueDate] = []
        map[q.dueDate].push({ type: 'quest', id: q.id, title: q.title, color: '#fbbf24' })
      }
    }
    for (const ev of calendarEvents) {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push({ type: 'event', id: ev.id, title: ev.title, color: ev.color ?? '#3b82f6' })
    }
    return map
  }, [quests, calendarEvents])

  const selectedEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : []
  const selectedCalEvs = selectedDay
    ? calendarEvents.filter(e => e.date === selectedDay)
    : []

  const handleAddEvent = () => {
    if (!evTitle.trim()) return
    addCalendarEvent({ title: evTitle.trim(), date: evDate, description: evDesc.trim() || undefined, color: evColor })
    notify('EVENT ADDED.', 'success')
    setEvTitle(''); setEvDesc(''); setEvDate(todayStr); setEvColor('#3b82f6')
    setAddingEvent(false)
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase">
            Time Management
          </p>
          <h1 className="font-orbitron text-lg font-bold text-[#93c5fd]">
            Calendar
          </h1>
        </div>
        <button
          onClick={() => setAddingEvent(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-orbitron text-[10px] uppercase tracking-wider"
          style={{ border: '1px solid #3b82f6', borderRadius: '2px', backgroundColor: 'rgba(59,130,246,0.15)', color: '#93c5fd', cursor: 'pointer' }}
        >
          <span className="text-base leading-none">+</span>
          Add Event
        </button>
      </div>

      {/* Add event modal */}
      {addingEvent && (
        <SystemPanel title="New Event" delay={0}>
          <div className="p-4 space-y-3">
            <input
              className="input-system w-full"
              placeholder="Event title"
              value={evTitle}
              onChange={e => setEvTitle(e.target.value)}
              maxLength={64}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block mb-1">Date</label>
                <input
                  type="date"
                  className="input-system text-sm"
                  value={evDate}
                  onChange={e => setEvDate(e.target.value)}
                />
              </div>
              <div>
                <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block mb-1">Color</label>
                <div className="relative">
                  <input
                    type="color"
                    value={evColor}
                    onChange={e => setEvColor(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                  <div
                    className="w-full h-10 rounded border cursor-pointer flex items-center justify-center"
                    style={{ background: evColor, border: `2px solid ${evColor}` }}
                  >
                    <span className="font-orbitron text-[8px] text-white uppercase tracking-wider drop-shadow">Pick Color</span>
                  </div>
                </div>
              </div>
            </div>
            <input
              className="input-system w-full"
              placeholder="Description (optional)"
              value={evDesc}
              onChange={e => setEvDesc(e.target.value)}
              maxLength={120}
            />
            <div className="flex gap-2">
              <button onClick={() => setAddingEvent(false)} className="btn-system flex-1 py-2 font-orbitron text-[9px]">Cancel</button>
              <button
                onClick={handleAddEvent}
                disabled={!evTitle.trim()}
                className="flex-1 py-2 font-orbitron text-[9px] uppercase tracking-wider"
                style={{
                  border: '1px solid #3b82f6', borderRadius: '2px',
                  backgroundColor: 'rgba(59,130,246,0.2)', color: '#93c5fd',
                  cursor: evTitle.trim() ? 'pointer' : 'not-allowed',
                  opacity: evTitle.trim() ? 1 : 0.4,
                }}
              >
                Add Event
              </button>
            </div>
          </div>
        </SystemPanel>
      )}

      {/* Calendar grid */}
      <SystemPanel title={`${MONTHS[month]} ${year}`} delay={0.05}>
        <div className="p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="font-orbitron text-[10px] px-3 py-1.5 uppercase tracking-wider transition-all"
              style={{ border: '1px solid #1e3a8a', borderRadius: '2px', color: '#64748b', cursor: 'pointer' }}
            >
              ‹ Prev
            </button>
            <span className="font-orbitron text-sm font-bold text-[#93c5fd]">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="font-orbitron text-[10px] px-3 py-1.5 uppercase tracking-wider transition-all"
              style={{ border: '1px solid #1e3a8a', borderRadius: '2px', color: '#64748b', cursor: 'pointer' }}
            >
              Next ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center py-1">
                <span className="font-orbitron text-[9px] text-[#374151] uppercase tracking-wider">{d}</span>
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const ds = dateStr(year, month, day)
              const events = eventsByDate[ds] ?? []
              const isToday = ds === todayStr
              const isSelected = ds === selectedDay
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : ds)}
                  className="aspect-square p-1 flex flex-col items-center transition-all relative"
                  style={{
                    borderRadius: '2px',
                    border: isSelected ? '1px solid #3b82f6' : isToday ? '1px solid #1e3a8a' : '1px solid transparent',
                    backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : isToday ? 'rgba(30,58,138,0.3)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="font-orbitron text-[10px] leading-none"
                    style={{ color: isToday ? '#93c5fd' : '#64748b' }}
                  >
                    {day}
                  </span>
                  {events.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {events.slice(0, 3).map((ev, idx) => (
                        <div
                          key={idx}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: ev.color ?? '#3b82f6' }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </SystemPanel>

      {/* Selected day events */}
      {selectedDay && (
        <SystemPanel title={`Events — ${selectedDay}`} delay={0}>
          <div className="divide-y divide-[#1e3a8a]">
            {selectedEvents.length === 0 ? (
              <div className="p-4 text-center">
                <p className="font-orbitron text-[10px] text-[#374151] uppercase tracking-wider">No events this day</p>
              </div>
            ) : (
              selectedEvents.map(ev => {
                const calEv = ev.type === 'event' ? calendarEvents.find(e => e.id === ev.id) : null
                return (
                  <div key={ev.id} className="p-3 flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: ev.color ?? '#3b82f6', boxShadow: `0 0 6px ${ev.color ?? '#3b82f6'}` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-orbitron text-xs text-[#e2e8f0]">{ev.title}</p>
                        <span
                          className="font-orbitron text-[8px] px-1.5 py-0.5"
                          style={{
                            border: `1px solid ${ev.color ?? '#3b82f6'}33`,
                            borderRadius: '2px',
                            color: '#64748b',
                          }}
                        >
                          {ev.type === 'quest' ? 'Quest' : 'Event'}
                        </span>
                      </div>
                      {calEv?.description && (
                        <p className="text-[10px] text-[#475569] italic mt-0.5">{calEv.description}</p>
                      )}
                    </div>
                    {ev.type === 'event' && (
                      <button
                        onClick={() => { deleteCalendarEvent(ev.id); notify('Event deleted.', 'error') }}
                        className="font-orbitron text-[8px] text-[#374151] px-1.5 py-0.5 hover:text-[#ef4444] transition-colors shrink-0"
                        style={{ border: '1px solid #1e3a8a', borderRadius: '2px' }}
                      >×</button>
                    )}
                  </div>
                )
              })
            )}
            <div className="p-3">
              <button
                onClick={() => { setEvDate(selectedDay); setAddingEvent(true) }}
                className="w-full py-1.5 font-orbitron text-[9px] uppercase tracking-wider"
                style={{ border: '1px dashed #1e3a8a', borderRadius: '2px', color: '#64748b', cursor: 'pointer' }}
              >
                + Add Event This Day
              </button>
            </div>
          </div>
        </SystemPanel>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#fbbf24]" />
          <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-wider">Quest due date</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
          <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-wider">Custom event</span>
        </div>
      </div>
    </div>
  )
}
