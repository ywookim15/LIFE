'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/store'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function useCloudSync() {
  const { user } = useAuth()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return

    const save = async () => {
      const state = useGameStore.getState()
      if (!state._hasHydrated) return

      const { player, quests, logs, achievements, titles, partyMembers, _migrated } = state

      await supabase.from('player_data').upsert(
        {
          user_id: user.id,
          data: { player, quests, logs, achievements, titles, partyMembers, _migrated },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    }

    const unsub = useGameStore.subscribe(() => {
      if (!useGameStore.getState()._hasHydrated) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(save, 1500)
    })

    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [user])
}
