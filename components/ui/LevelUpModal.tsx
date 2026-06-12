'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/store'
import { getTierColor } from '@/lib/gameLogic'

function Particle({ delay }: { delay: number }) {
  const x = (Math.random() - 0.5) * 600
  const size = 2 + Math.random() * 4

  return (
    <motion.div
      className="absolute rounded-full bg-[#3b82f6]"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '60%',
        boxShadow: '0 0 6px #3b82f6',
      }}
      initial={{ opacity: 1, y: 0, x: 0 }}
      animate={{
        opacity: 0,
        y: -(100 + Math.random() * 200),
        x,
        scale: 0,
      }}
      transition={{ duration: 1.5 + Math.random(), delay, ease: 'easeOut' }}
    />
  )
}

export default function LevelUpModal() {
  const pendingLevelUp = useGameStore(s => s.pendingLevelUp)
  const clearPendingLevelUp = useGameStore(s => s.clearPendingLevelUp)
  const [particles] = useState(() => Array.from({ length: 40 }, (_, i) => i))

  useEffect(() => {
    if (!pendingLevelUp) return
    const t = setTimeout(clearPendingLevelUp, 4500)
    return () => clearTimeout(t)
  }, [pendingLevelUp, clearPendingLevelUp])

  if (!pendingLevelUp) return null

  const tierColor = getTierColor(pendingLevelUp.newTier)

  return (
    <AnimatePresence>
      {pendingLevelUp && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden cursor-pointer"
          style={{ backgroundColor: 'rgba(5, 7, 15, 0.95)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={clearPendingLevelUp}
        >
          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map(i => (
              <Particle key={i} delay={i * 0.05} />
            ))}
          </div>

          {/* Ring */}
          <motion.div
            className="absolute rounded-full border-2 border-[#3b82f6]"
            style={{ boxShadow: '0 0 40px rgba(59,130,246,0.5)' }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 600, height: 600, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />

          {/* Content */}
          <div className="text-center relative z-10">
            <motion.p
              className="font-orbitron text-[#3b82f6] text-sm tracking-[0.4em] uppercase mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              System Message
            </motion.p>

            <motion.h1
              className="font-orbitron font-black text-6xl md:text-8xl tracking-widest mb-6"
              style={{
                color: pendingLevelUp.tieredUp ? tierColor : '#e2e8f0',
                textShadow: pendingLevelUp.tieredUp
                  ? `0 0 30px ${tierColor}, 0 0 60px ${tierColor}88`
                  : '0 0 20px rgba(59,130,246,0.8)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
            >
              {pendingLevelUp.tieredUp ? 'TIER UP' : 'LEVEL UP'}
            </motion.h1>

            <motion.div
              className="flex items-center justify-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {pendingLevelUp.tieredUp ? (
                <>
                  <div className="text-center">
                    <p className="font-orbitron text-2xl font-bold text-[#64748b]">
                      {pendingLevelUp.previousTier}
                    </p>
                    <p className="text-[10px] text-[#374151] tracking-widest uppercase mt-1">Previous</p>
                  </div>
                  <div className="font-orbitron text-[#3b82f6] text-3xl">→</div>
                  <div className="text-center">
                    <p
                      className="font-orbitron text-3xl font-black"
                      style={{ color: tierColor, textShadow: `0 0 20px ${tierColor}` }}
                    >
                      {pendingLevelUp.newTier}
                    </p>
                    <p className="text-[10px] tracking-widest uppercase mt-1" style={{ color: tierColor }}>
                      New Tier
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="font-orbitron text-3xl font-bold text-[#64748b]">
                      {pendingLevelUp.previousLevel}
                    </p>
                    <p className="text-[10px] text-[#374151] tracking-widest uppercase mt-1">Previous</p>
                  </div>
                  <div className="font-orbitron text-[#3b82f6] text-3xl">→</div>
                  <div className="text-center">
                    <p className="font-orbitron text-4xl font-black text-[#93c5fd]"
                      style={{ textShadow: '0 0 20px rgba(147,197,253,0.8)' }}>
                      {pendingLevelUp.newLevel}
                    </p>
                    <p className="text-[10px] text-[#3b82f6] tracking-widest uppercase mt-1">New Level</p>
                  </div>
                </>
              )}
            </motion.div>

            <motion.p
              className="font-orbitron text-[#64748b] text-xs tracking-widest uppercase mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Click to continue
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
