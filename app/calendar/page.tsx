'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useGameStore } from '@/lib/store'
import { useNotification } from '@/contexts/NotificationContext'
import SystemPanel from '@/components/ui/SystemPanel'
import type { CalendarEvent } from '@/lib/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function pad(n: number) { return String(n).padStart(2, '0') }
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

// Is dateStr in [start, end] inclusive?
function inRange(dateStr: string, start: string, end: string) {
  return dateStr >= start && dateStr <= end
}

type DayItem = {
  id: string
  label: string    // shortTitle or truncated title
  color: string
  type: 'quest' | 'event'
  isMultiDay?: boolean
  isStart?: boolean
  isEnd?: boolean
  time?: string
  description?: string
}

// ─── Event Form ───────────────────────────────────────────────────────────────

interface EventFormProps {
  initialDate?: string
  onClose: () => void
  onSave: (ev: Omit<CalendarEvent, 'id'>) => void
}

function EventForm({ initialDate = '', onClose, onSave }: EventFormProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [title, setTitle] = useState('')
  const [shortTitle, setShortTitle] = useState('')
  const [startDate, setStartDate] = useState(initialDate || today)
  const [endDate, setEndDate] = useState(initialDate || today)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3b82f6')

  const isMultiDay = endDate > startDate

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      shortTitle: shortTitle.trim() || undefined,
      date: startDate,
      endDate: endDate > startDate ? endDate : undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      description: description.trim() || undefined,
      color,
    })
  }

  return (
    <SystemPanel title="New Event" delay={0}>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
          <input
            className="input-system w-full"
            placeholder="Event title *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={64}
            autoFocus
          />
          <div className="relative w-10 h-10 shrink-0">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
            <div className="w-10 h-10 rounded border-2 cursor-pointer" style={{ background: color, borderColor: color }} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">
            Calendar Label — max 15 chars
          </label>
          <input
            className="input-system text-sm"
            placeholder="Short label (optional)"
            value={shortTitle}
            onChange={e => setShortTitle(e.target.value.slice(0, 15))}
            maxLength={15}
          />
          <p className="font-orbitron text-[8px] text-[#374151]">{shortTitle.length}/15</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">Start Date</label>
            <input type="date" className="input-system text-sm" value={startDate} onChange={e => {
              setStartDate(e.target.value)
              if (e.target.value > endDate) setEndDate(e.target.value)
            }} />
          </div>
          <div className="space-y-1">
            <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">End Date</label>
            <input type="date" className="input-system text-sm" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">Start Time (opt.)</label>
            <input type="time" className="input-system text-sm" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="font-orbitron text-[8px] text-[#64748b] uppercase tracking-wider block">End Time (opt.)</label>
            <input type="time" className="input-system text-sm" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>

        {isMultiDay && (
          <p className="font-orbitron text-[9px] text-[#3b82f6]">
            Spans {startDate} → {endDate}
          </p>
        )}

        <input
          className="input-system w-full"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={120}
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-system flex-1 py-2 font-orbitron text-[9px]">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2 font-orbitron text-[9px] uppercase tracking-wider"
            style={{
              border: '1px solid #3b82f6', borderRadius: '2px',
              backgroundColor: 'rgba(59,130,246,0.2)', color: '#93c5fd',
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              opacity: title.trim() ? 1 : 0.4,
            }}
          >
            Add Event
          </button>
        </div>
      </div>
    </SystemPanel>
  )
}

// ─── Day Popup ────────────────────────────────────────────────────────────────

function DayPopup({ dateStr, items, onClose, onDelete }: {
  dateStr: string
  items: DayItem[]
  onClose: () => void
  onDelete: (id: string, type: 'event' | 'quest') => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(5,7,15,0.7)' }}>
      <div ref={ref} className="panel w-full max-w-sm">
        <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: '#1e3a8a', backgroundColor: 'rgba(30,58,138,0.2)' }}>
          <span className="font-orbitron text-[10px] text-[#93c5fd] uppercase tracking-widest">{dateStr}</span>
          <button onClick={onClose} style={{ color: '#64748b' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: '#1e3a8a' }}>
          {items.map(item => (
            <div key={item.id} className="p-3 flex items-start gap-2">
              <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: item.color, boxShadow: `0 0 4px ${item.color}` }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-orbitron text-xs text-[#e2e8f0] truncate">{item.label}</p>
                  <span className="font-orbitron text-[8px] px-1 py-0.5 shrink-0" style={{ border: `1px solid ${item.color}44`, borderRadius: '2px', color: '#64748b' }}>
                    {item.type}
                  </span>
                </div>
                {item.time && <p className="font-orbitron text-[9px] text-[#64748b] mt-0.5">{item.time}</p>}
                {item.description && <p className="text-[10px] text-[#475569] italic mt-0.5">{item.description}</p>}
              </div>
              {item.type === 'event' && (
                <button
                  onClick={() => onDelete(item.id, 'event')}
                  className="shrink-0 font-orbitron text-[8px] px-1.5 py-0.5 hover:text-[#ef4444] transition-colors"
                  style={{ border: '1px solid #1e3a8a', borderRadius: '2px', color: '#374151' }}
                >×</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
  const [clickedDate, setClickedDate] = useState<string | null>(null)
  const [popupDate, setPopupDate] = useState<string | null>(null)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = today.toISOString().slice(0, 10)

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  // Build per-day items map for this month
  const itemsByDate = useMemo(() => {
    const map: Record<string, DayItem[]> = {}

    const addItem = (ds: string, item: DayItem) => {
      if (!map[ds]) map[ds] = []
      map[ds].push(item)
    }

    // Quests with due dates (habits excluded — they have no due date and are shown in the Quests tab)
    for (const q of quests) {
      if (!q.dueDate) continue
      const ds = q.dueDate
      addItem(ds, {
        id: q.id,
        label: q.shortTitle || (q.title.length > 13 ? q.title.slice(0, 12) + '…' : q.title),
        color: '#fbbf24',
        type: 'quest',
        time: q.dueTime,
      })
    }

    // Calendar events (potentially multi-day)
    for (const ev of calendarEvents) {
      const start = ev.date
      const end = ev.endDate || ev.date
      const isMultiDay = end > start

      if (!isMultiDay) {
        addItem(start, {
          id: ev.id,
          label: ev.shortTitle || (ev.title.length > 13 ? ev.title.slice(0, 12) + '…' : ev.title),
          color: ev.color ?? '#3b82f6',
          type: 'event',
          time: ev.startTime ? `${ev.startTime}${ev.endTime ? ' – ' + ev.endTime : ''}` : undefined,
          description: ev.description,
        })
      } else {
        // Generate label for each day in range
        let cur = new Date(start + 'T00:00:00')
        const endD = new Date(end + 'T00:00:00')
        let dayIdx = 0
        while (cur <= endD) {
          const ds = cur.toISOString().slice(0, 10)
          const isStart = dayIdx === 0
          const isEndDay = ds === end
          const label = isStart
            ? (ev.shortTitle || (ev.title.length > 11 ? ev.title.slice(0, 10) + '…' : ev.title)) + ' →'
            : isEndDay
              ? '← ' + (ev.shortTitle || (ev.title.length > 11 ? ev.title.slice(0, 10) + '…' : ev.title))
              : '···'
          addItem(ds, {
            id: ev.id + '_' + ds,
            label,
            color: ev.color ?? '#3b82f6',
            type: 'event',
            isMultiDay: true,
            isStart,
            isEnd: isEndDay,
            time: isStart && ev.startTime ? `${ev.startTime}${ev.endTime ? ' – ' + ev.endTime : ''}` : undefined,
            description: isStart ? ev.description : undefined,
          })
          cur.setDate(cur.getDate() + 1)
          dayIdx++
        }
      }
    }

    return map
  }, [quests, calendarEvents, todayStr])

  const handleSaveEvent = (evData: Omit<CalendarEvent, 'id'>) => {
    addCalendarEvent(evData)
    notify('EVENT ADDED.', 'success')
    setAddingEvent(false)
    setClickedDate(null)
  }

  const handleDelete = (id: string, type: 'event' | 'quest') => {
    if (type === 'event') {
      // id might be ev.id + '_' + date for multi-day — extract base id
      const baseId = id.includes('_2') ? id.split('_').slice(0, -1).join('_') : id
      deleteCalendarEvent(baseId)
      notify('Event deleted.', 'error')
    }
    setPopupDate(null)
  }

  const MAX_VISIBLE = 2

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-orbitron text-[10px] text-[#64748b] tracking-[0.3em] uppercase">Time Management</p>
          <h1 className="font-orbitron text-lg font-bold text-[#93c5fd]">Calendar</h1>
        </div>
        <button
          onClick={() => setAddingEvent(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-orbitron text-[10px] uppercase tracking-wider"
          style={{ border: '1px solid #3b82f6', borderRadius: '2px', backgroundColor: 'rgba(59,130,246,0.15)', color: '#93c5fd', cursor: 'pointer' }}
        >
          + Add Event
        </button>
      </div>

      {/* Add event form */}
      {addingEvent && (
        <EventForm
          initialDate={clickedDate || todayStr}
          onClose={() => { setAddingEvent(false); setClickedDate(null) }}
          onSave={handleSaveEvent}
        />
      )}

      {/* Popup for overflow days */}
      {popupDate && (() => {
        const items = itemsByDate[popupDate] ?? []
        return (
          <DayPopup
            dateStr={popupDate}
            items={items}
            onClose={() => setPopupDate(null)}
            onDelete={handleDelete}
          />
        )
      })()}

      {/* Calendar grid */}
      <SystemPanel title={`${MONTHS[month]} ${year}`} delay={0.05}>
        <div className="p-3">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="font-orbitron text-[10px] px-3 py-1.5 uppercase tracking-wider transition-all" style={{ border: '1px solid var(--border-primary)', borderRadius: '2px', color: 'var(--text-muted)', cursor: 'pointer' }}>‹ Prev</button>
            <span className="font-orbitron text-sm font-bold text-[#93c5fd]">{MONTHS[month]} {year}</span>
            <button onClick={nextMonth} className="font-orbitron text-[10px] px-3 py-1.5 uppercase tracking-wider transition-all" style={{ border: '1px solid var(--border-primary)', borderRadius: '2px', color: 'var(--text-muted)', cursor: 'pointer' }}>Next ›</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center py-1">
                <span className="font-orbitron text-[8px] text-[#374151] uppercase tracking-wider">{d}</span>
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: 'var(--border-primary)' }}>
            {/* Empty offset cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className="min-h-[80px] p-1" style={{ backgroundColor: 'var(--bg-void)' }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const ds = toDateStr(year, month, day)
              const items = itemsByDate[ds] ?? []
              const visible = items.slice(0, MAX_VISIBLE)
              const overflow = items.length - MAX_VISIBLE
              const isToday = ds === todayStr

              return (
                <div
                  key={day}
                  className="min-h-[80px] p-1 flex flex-col cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isToday ? 'rgba(30,58,138,0.25)' : 'var(--bg-panel)',
                  }}
                  onMouseEnter={e => { if (!isToday) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--card-bg-hover)' }}
                  onMouseLeave={e => { if (!isToday) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-panel)' }}
                  onClick={() => { setClickedDate(ds); setAddingEvent(false); setPopupDate(null) }}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className="font-orbitron text-[10px] leading-none"
                      style={{ color: isToday ? '#93c5fd' : 'var(--text-muted)' }}
                    >
                      {day}
                    </span>
                    {isToday && <span className="font-orbitron text-[7px] text-[#93c5fd] uppercase tracking-widest">today</span>}
                  </div>

                  {/* Event chips */}
                  <div className="flex-1 space-y-px overflow-hidden">
                    {visible.map((item, idx) => {
                      const isContinued = item.isMultiDay && !item.isStart
                      return (
                        <div
                          key={item.id + idx}
                          className="flex items-center gap-0.5 overflow-hidden"
                          style={{
                            backgroundColor: item.color + (isContinued ? '30' : '22'),
                            borderLeft: isContinued ? `2px solid ${item.color}` : `3px solid ${item.color}`,
                            borderRadius: '1px',
                            paddingLeft: '3px',
                            paddingRight: '2px',
                          }}
                          onClick={e => { e.stopPropagation(); setPopupDate(ds) }}
                          title={item.label}
                        >
                          <span
                            className="font-orbitron text-[8px] leading-tight truncate w-full py-px"
                            style={{ color: item.color }}
                          >
                            {item.label}
                          </span>
                        </div>
                      )
                    })}
                    {overflow > 0 && (
                      <button
                        className="w-full text-left font-orbitron text-[7px] text-[#64748b] hover:text-[#93c5fd] transition-colors px-0.5"
                        onClick={e => { e.stopPropagation(); setPopupDate(ds) }}
                      >
                        +{overflow} more
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </SystemPanel>

      {/* Clicked day quick actions */}
      {clickedDate && !addingEvent && (
        <SystemPanel title={`${clickedDate}`} delay={0}>
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-orbitron text-[10px] text-[#64748b]">
                {(itemsByDate[clickedDate] ?? []).length} item{(itemsByDate[clickedDate] ?? []).length !== 1 ? 's' : ''}
              </span>
              {(itemsByDate[clickedDate] ?? []).length > 0 && (
                <button
                  onClick={() => setPopupDate(clickedDate)}
                  className="font-orbitron text-[9px] px-2 py-0.5"
                  style={{ border: '1px solid #1e3a8a', borderRadius: '2px', color: '#64748b', cursor: 'pointer' }}
                >
                  View All
                </button>
              )}
              <button
                onClick={() => setAddingEvent(true)}
                className="font-orbitron text-[9px] px-2 py-0.5 ml-auto"
                style={{ border: '1px solid #3b82f6', borderRadius: '2px', color: '#93c5fd', cursor: 'pointer' }}
              >
                + Add Event
              </button>
            </div>
          </div>
        </SystemPanel>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-3 rounded-sm" style={{ backgroundColor: '#fbbf2233', borderLeft: '3px solid #fbbf24' }} />
          <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-wider">Quest due</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-3 rounded-sm" style={{ backgroundColor: '#3b82f633', borderLeft: '3px solid #3b82f6' }} />
          <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-wider">Event</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-3 rounded-sm" style={{ backgroundColor: '#3b82f630', borderLeft: '2px solid #3b82f6' }} />
          <span className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-wider">Multi-day cont.</span>
        </div>
      </div>
    </div>
  )
}
