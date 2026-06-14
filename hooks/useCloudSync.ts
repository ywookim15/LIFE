'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/store'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

function buildPayload(userId: string) {
  const state = useGameStore.getState()
  if (!state._hasHydrated) return null
  const {
    player, quests, logs, achievements, titles, partyMembers, _migrated,
    workoutPlans, workoutLogs, calendarEvents, manualPRs, statConfig,
  } = state
  return {
    user_id: userId,
    data: {
      player, quests, logs, achievements, titles, partyMembers, _migrated,
      workoutPlans, workoutLogs, calendarEvents, manualPRs, statConfig,
    },
    updated_at: new Date().toISOString(),
  }
}

export function useCloudSync() {
  const { user } = useAuth()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasPendingRef = useRef(false)

  useEffect(() => {
    if (!user) return

    const save = async () => {
      const payload = buildPayload(user.id)
      if (!payload) return
      hasPendingRef.current = false
      await supabase.from('player_data').upsert(payload, { onConflict: 'user_id' })
    }

    // Flush using keepalive fetch so the request survives page unload.
    // Falls back to regular save for environments without keepalive support.
    const flushWithKeepalive = async () => {
      if (!hasPendingRef.current) return
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      hasPendingRef.current = false

      const payload = buildPayload(user.id)
      if (!payload) return

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      try {
        fetch(`${supabaseUrl}/rest/v1/player_data?on_conflict=user_id`, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify(payload),
        })
      } catch {
        // keepalive may throw in some browsers; fall back to regular save
        save()
      }
    }

    const schedule = () => {
      if (!useGameStore.getState()._hasHydrated) return
      hasPendingRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(save, 500)
    }

    const onHide = () => { if (document.visibilityState === 'hidden') flushWithKeepalive() }
    const onUnload = () => flushWithKeepalive()

    const unsub = useGameStore.subscribe(schedule)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', onUnload)

    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [user])
}
