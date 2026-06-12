'use client'

import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useNotification } from '@/contexts/NotificationContext'
import { useEffect, useState } from 'react'

const TYPE_COLORS = {
  success: '#4fffb0',
  error: '#ef4444',
  warning: '#fbbf24',
  info: '#93c5fd',
}

export default function SystemNotification() {
  const { notifications } = useNotification()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
      <AnimatePresence>
        {notifications.map(note => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="panel px-3 py-2.5 flex items-start gap-2.5"
            style={{
              borderColor: TYPE_COLORS[note.type] + '66',
              boxShadow: `0 0 12px ${TYPE_COLORS[note.type]}33`,
              minWidth: 240,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
              style={{
                backgroundColor: TYPE_COLORS[note.type],
                boxShadow: `0 0 6px ${TYPE_COLORS[note.type]}`,
              }}
            />
            <p
              className="font-orbitron text-[10px] tracking-wider leading-relaxed"
              style={{ color: TYPE_COLORS[note.type] }}
            >
              {note.text}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}
