'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/lib/store'

interface AuthContextType {
  user: User | null
  session: Session | null
  authLoading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function loadUserData(userId: string) {
  const { data, error } = await supabase
    .from('player_data')
    .select('data')
    .eq('user_id', userId)
    .single()

  if (error || !data?.data) {
    useGameStore.getState().setHasHydrated(true)
  } else {
    useGameStore.getState().loadGameState(data.data)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadUserData(session.user.id)
      } else {
        useGameStore.getState().setHasHydrated(true)
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN' && session?.user) {
        setAuthLoading(true)
        await loadUserData(session.user.id)
        setAuthLoading(false)
      } else if (event === 'SIGNED_OUT') {
        useGameStore.getState().resetGame()
        useGameStore.getState().setHasHydrated(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const deleteAccount = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return 'Not authenticated'

    const res = await fetch('/api/delete-account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return body.error || 'Failed to delete account'
    }

    await supabase.auth.signOut()
    return null
  }

  return (
    <AuthContext.Provider value={{ user, session, authLoading, signIn, signUp, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
