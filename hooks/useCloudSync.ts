'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/store'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

function buildPayload(userId: string) {
  const state = useGameStore.getState()
  if (!state._hasHydrated) return null
  const {
    player, quests, logs, achievements, titles, partyMembers, _migrated, _subStatV2,
    workoutPlans, workoutLogs, calendarEvents, manualPRs, statConfig,
  } = state
  return {
    user_id: userId,
    data: {
      player, quests, logs, achievements, titles, partyMembers, _migrated, _subStatV2,
      workoutPlans, workoutLogs, calendarEvents, manualPRs, statConfig,
    },
    updated_at: new Date().toISOString(),
  }
}

// Module-level immediate-save trigger — callable from anywhere (e.g. QuestCard on habit complete)
let _immediateSave: (() => void) | null = null
export function flushSave() { _immediateSave?.() }

export function useCloudSync() {
  const { user, session } = useAuth()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasPendingRef = useRef(false)
  // Cache the token synchronously so keepalive flush doesn't need an async getSession() call
  const tokenRef = useRef<string | null>(null)

  useEffect(() => {
    tokenRef.current = session?.access_token ?? null
  }, [session])

  useEffect(() => {
    if (!user) return

    const save = async () => {
      const payload = buildPayload(user.id)
      if (!payload) return
      hasPendingRef.current = false
      timerRef.current = null
      await supabase.from('player_data').upsert(payload, { onConflict: 'user_id' })
    }

    // Fully synchronous keepalive flush — safe to call during beforeunload
    const flushWithKeepalive = () => {
      if (!hasPendingRef.current) return
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      hasPendingRef.current = false

      const token = tokenRef.current
      const payload = buildPayload(user.id)
      if (!payload || !token) return

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      try {
        fetch(`${supabaseUrl}/rest/v1/player_data?on_conflict=user_id`, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`,
            'Prefer': 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify(payload),
        })
      } catch {
        // keepalive may throw in some browsers; ignore — regular debounce will retry
      }
    }

    const schedule = () => {
      if (!useGameStore.getState()._hasHydrated) return
      hasPendingRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(save, 500)
    }

    _immediateSave = () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      hasPendingRef.current = true
      save()
    }

    const onHide = () => { if (document.visibilityState === 'hidden') flushWithKeepalive() }
    const onUnload = () => flushWithKeepalive()

    const unsub = useGameStore.subscribe(schedule)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', onUnload)

    return () => {
      _immediateSave = null
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [user])
}
