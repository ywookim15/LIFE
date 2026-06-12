'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/lib/store'

export default function OnboardingModal() {
  const [name, setName] = useState('')
  const [phase, setPhase] = useState<'init' | 'input' | 'begin'>('init')
  const initPlayer = useGameStore(s => s.initPlayer)

  const handleBegin = () => {
    if (!name.trim()) return
    setPhase('begin')
    setTimeout(() => {
      initPlayer(name.trim())
    }, 1200)
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(5, 7, 15, 0.98)' }}
    >
      <motion.div
        className="panel w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Header */}
        <div
          className="px-6 py-3 border-b border-[#1e3a8a]"
          style={{ backgroundColor: 'rgba(30, 58, 138, 0.2)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" style={{ boxShadow: '0 0 6px #3b82f6' }} />
            <span className="font-orbitron text-[10px] tracking-[0.3em] text-[#93c5fd] uppercase">
              System Initialization
            </span>
          </div>
        </div>

        <div className="p-6">
          {phase === 'init' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="space-y-2">
                <motion.p
                  className="font-orbitron text-[#3b82f6] text-xs tracking-[0.4em] uppercase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Initializing...
                </motion.p>
                <motion.h2
                  className="font-orbitron text-3xl font-bold text-[#e2e8f0] text-glow-blue"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  SYSTEM ONLINE
                </motion.h2>
              </div>

              <motion.div
                className="text-left space-y-3 border border-[#1e3a8a] p-4"
                style={{ borderRadius: '2px', backgroundColor: 'rgba(30, 58, 138, 0.1)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
              >
                <p className="text-[#64748b] text-xs leading-relaxed">
                  You have awakened to the System. Your actions in the real world are now tracked, evaluated, and translated into measurable growth.
                </p>
                <p className="text-[#64748b] text-xs leading-relaxed">
                  Complete quests. Submit daily logs. The System judges all. Growth is the only currency that matters here.
                </p>
                <p className="text-[#93c5fd] text-xs font-medium">
                  Current status: <span className="text-[#fbbf24]">UNREGISTERED</span>
                </p>
              </motion.div>

              <motion.button
                className="btn-system w-full py-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                onClick={() => setPhase('input')}
              >
                REGISTER PLAYER
              </motion.button>
            </motion.div>
          )}

          {phase === 'input' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div>
                <p className="font-orbitron text-[#93c5fd] text-xs tracking-widest uppercase mb-1">
                  Player Registration
                </p>
                <p className="text-[#64748b] text-xs">
                  Enter your designation. This will be your identity in the system.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-orbitron text-[10px] text-[#64748b] tracking-widest uppercase block">
                  Player Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBegin()}
                  placeholder="Enter your name..."
                  className="input-system"
                  maxLength={32}
                  autoFocus
                />
              </div>

              <button
                className="btn-system w-full py-3"
                onClick={handleBegin}
                disabled={!name.trim()}
                style={{ opacity: name.trim() ? 1 : 0.4 }}
              >
                BEGIN
              </button>
            </motion.div>
          )}

          {phase === 'begin' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4 space-y-4"
            >
              <p className="font-orbitron text-[#3b82f6] text-sm tracking-widest uppercase">
                Registering...
              </p>
              <p className="font-orbitron text-2xl font-bold text-[#e2e8f0]">
                {name}
              </p>
              <p className="text-[#64748b] text-xs">
                Player profile created. Initial stats assigned.
              </p>
              <p className="font-orbitron text-[#fbbf24] text-xs tracking-wider">
                TIER F — LEVEL 1
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
