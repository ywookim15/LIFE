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

let _loadInProgress = false

async function loadUserData(userId: string) {
  if (_loadInProgress) return
  _loadInProgress = true
  try {
    const { data, error } = await supabase
      .from('player_data')
      .select('data')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No row yet — new user, safe to mark hydrated with empty store
        useGameStore.getState().setHasHydrated(true)
      }
      // Any other error (network, auth, etc.): leave hydrated=false so cloud sync
      // never saves the uninitialised store and overwrites real data.
    } else if (!data?.data) {
      useGameStore.getState().setHasHydrated(true)
    } else {
      useGameStore.getState().loadGameState(data.data)
    }
  } finally {
    _loadInProgress = false
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
        // Supabase fires SIGNED_IN on every page load (not just actual sign-ins).
        // Only load from Supabase if the store isn't already hydrated — otherwise
        // this overwrites the user's current session data with a stale Supabase
        // snapshot, wiping workout logs, resetting habits, etc.
        if (!useGameStore.getState()._hasHydrated) {
          setAuthLoading(true)
          await loadUserData(session.user.id)
          setAuthLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        // Disable cloud sync immediately — never let a signed-out store overwrite Supabase data.
        // Don't call resetGame(): it clears workoutLogs/XP and could race with the sync cleanup.
        // The login screen is shown because user=null; on next sign-in loadGameState reloads data.
        useGameStore.getState().setHasHydrated(false)
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
