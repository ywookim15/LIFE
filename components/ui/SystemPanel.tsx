'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface SystemPanelProps {
  title?: string
  children: ReactNode
  className?: string
  headerColor?: string
  animate?: boolean
  delay?: number
}

export default function SystemPanel({
  title,
  children,
  className = '',
  headerColor = '#1e3a8a',
  animate = true,
  delay = 0,
}: SystemPanelProps) {
  const content = (
    <div
      className={`panel relative overflow-hidden ${className}`}
    >
      {title && (
        <div
          className="px-3 py-2 border-b border-[#1e3a8a] flex items-center gap-2"
          style={{ backgroundColor: headerColor + '33' }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }}
          />
          <span
            className="font-orbitron text-[10px] tracking-[0.2em] uppercase text-[#93c5fd]"
          >
            {title}
          </span>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )

  if (!animate) return content

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  )
}
