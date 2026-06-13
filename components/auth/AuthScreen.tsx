'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

type Mode = 'signin' | 'signup'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    const err = mode === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password)

    if (err) {
      setError(err)
      setLoading(false)
    } else if (mode === 'signup') {
      setSuccess('Account created. Check your email to verify, then sign in.')
      setLoading(false)
    }
    // On successful sign-in, AuthContext handles the rest
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: '#05070f' }}
    >
      <motion.div
        className="w-full max-w-sm px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Branding */}
        <div className="mb-8 text-center">
          <p className="font-orbitron text-[9px] text-[#374151] tracking-[0.5em] uppercase mb-3">
            System v1.0
          </p>
          <h1
            className="font-orbitron text-3xl font-black text-[#93c5fd] tracking-widest"
            style={{ textShadow: '0 0 30px rgba(147,197,253,0.4)' }}
          >
            LifeGame
          </h1>
          <p className="font-orbitron text-[9px] text-[#374151] mt-2 tracking-widest uppercase">
            Real Life. Real Growth. System Evaluated.
          </p>
        </div>

        {/* Auth panel */}
        <div
          className="p-6 space-y-4"
          style={{
            border: '1px solid #1e3a8a',
            borderRadius: '2px',
            backgroundColor: 'rgba(10, 15, 40, 0.7)',
          }}
        >
          {/* Mode tabs */}
          <div className="flex gap-2">
            {(['signin', 'signup'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-1.5 font-orbitron text-[9px] uppercase tracking-wider transition-all"
                style={{
                  border: `1px solid ${mode === m ? '#3b82f6' : '#1e3a8a'}`,
                  borderRadius: '2px',
                  backgroundColor: mode === m ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: mode === m ? '#93c5fd' : '#374151',
                  cursor: 'pointer',
                }}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-system w-full"
                placeholder="operator@system.io"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label className="font-orbitron text-[9px] text-[#64748b] uppercase tracking-widest block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-system w-full"
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div
                className="p-2.5 font-orbitron text-[9px] text-[#ef4444]"
                style={{ border: '1px solid #7f1d1d', borderRadius: '2px' }}
              >
                SYSTEM ERROR: {error}
              </div>
            )}

            {success && (
              <div
                className="p-2.5 font-orbitron text-[9px] text-[#4fffb0]"
                style={{ border: '1px solid #064e3b', borderRadius: '2px' }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || password.length < 6}
              className="w-full py-2.5 font-orbitron text-[10px] uppercase tracking-wider transition-all"
              style={{
                border: `1px solid ${loading ? '#1e3a8a' : '#3b82f6'}`,
                borderRadius: '2px',
                background: loading ? 'transparent' : 'rgba(59,130,246,0.25)',
                color: loading ? '#374151' : '#93c5fd',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 12px rgba(59,130,246,0.15)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-[#1e3a8a] border-t-[#3b82f6] rounded-full animate-spin" />
                  Processing...
                </span>
              ) : mode === 'signin' ? 'Access System' : 'Initialize Account'}
            </button>
          </form>
        </div>

        <p className="text-center font-orbitron text-[8px] text-[#1e3a8a] mt-4 tracking-widest uppercase">
          Data encrypted — saved to cloud
        </p>
      </motion.div>
    </div>
  )
}
