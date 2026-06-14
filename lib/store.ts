import { create } from 'zustand'
import {
  Player, Quest, DailyLog, Achievement, Title, PartyMember,
  LevelUpData, StatKey, AIEvaluation, StatBlock, SubStat, StatSnapshot,
  WorkoutPlan, WorkoutLog, StatConfig, CalendarEvent, ManualPR,
} from './types'
import {
  calcXPToNext, getNextTier, generateId, getTodayDate,
  checkAchievements, getStreakMultiplier, localDateStr,
} from './gameLogic'
import { createInitialPlayer, DEFAULT_ACHIEVEMENTS, DEFAULT_TITLES, DEFAULT_STAT_CONFIG } from './defaultData'

interface GameStore {
  player: Player | null
  quests: Quest[]
  logs: DailyLog[]
  achievements: Achievement[]
  titles: Title[]
  partyMembers: PartyMember[]
  pendingLevelUp: LevelUpData | null
  _hasHydrated: boolean
  _migrated: boolean
  statConfig: StatConfig[]
  calendarEvents: CalendarEvent[]
  manualPRs: ManualPR[]

  setHasHydrated: (v: boolean) => void
  loadGameState: (data: unknown) => void
  initPlayer: (name: string) => void
  updatePlayerName: (name: string) => void
  equipTitle: (titleId: string) => void

  // Stat config management
  addStat: (cfg: Omit<StatConfig, 'key'> & { key?: string }) => void
  deleteStat: (key: string) => void
  updateStatConfig: (key: string, updates: Partial<Omit<StatConfig, 'key'>>) => void

  awardXP: (
    totalXP: number,
    breakdown: { stat: StatKey; xp: number; reasoning: string }[],
    subStatUpdates?: { id: string; increase: number }[]
  ) => { leveledUp: boolean; tieredUp: boolean; newlyUnlocked: string[] }

  addQuest: (quest: Omit<Quest, 'id' | 'createdAt' | 'status'>) => void
  updateQuest: (questId: string, updates: Partial<Omit<Quest, 'id' | 'createdAt' | 'status'>>) => void
  completeQuest: (questId: string) => void
  failQuest: (questId: string) => void
  deleteQuest: (questId: string) => void
  updateMilestone: (questId: string, milestoneId: string, completed: boolean) => void
  resetDueHabits: () => void

  submitLog: (content: string, completedQuestIds: string[]) => DailyLog
  updateLogEvaluation: (logId: string, evaluation: AIEvaluation) => void

  addSubStat: (parentStat: StatKey, name: string, description?: string) => string
  updateSubStatValue: (subStatId: string, newValue: number) => void
  updateSubStat: (subStatId: string, updates: Partial<Pick<SubStat, 'name' | 'description' | 'value'>>) => void
  deleteSubStat: (subStatId: string) => void

  addPartyMember: (member: PartyMember) => void
  removePartyMember: (memberId: string) => void

  workoutPlans: WorkoutPlan[]
  workoutLogs: WorkoutLog[]
  addWorkoutPlan: (plan: Omit<WorkoutPlan, 'id' | 'createdAt'>) => void
  updateWorkoutPlan: (planId: string, updates: Partial<Pick<WorkoutPlan, 'name' | 'exercises'>>) => void
  deleteWorkoutPlan: (planId: string) => void
  unlockQuest: (questId: string) => void
  logWorkout: (log: Omit<WorkoutLog, 'id'>) => void
  deleteWorkoutLog: (logId: string) => void

  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void
  deleteCalendarEvent: (id: string) => void

  addManualPR: (pr: Omit<ManualPR, 'id'>) => void
  deleteManualPR: (id: string) => void

  snapshotStatHistory: () => void
  checkAndUnlockAchievements: () => string[]
  clearPendingLevelUp: () => void
  migrateIfNeeded: () => void
  resetGame: () => void
  exportProfile: () => string
}

function recomputeStatValue(subStats: SubStat[]): number {
  return subStats.reduce((sum, ss) => sum + ss.value, 0)
}

export const useGameStore = create<GameStore>()(
  (set, get) => ({
    player: null,
    quests: [],
    logs: [],
    achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
    titles: DEFAULT_TITLES.map(t => ({ ...t })),
    partyMembers: [],
    workoutPlans: [],
    workoutLogs: [],
    calendarEvents: [],
    manualPRs: [],
    statConfig: DEFAULT_STAT_CONFIG.map(c => ({ ...c })),
    pendingLevelUp: null,
    _hasHydrated: false,
    _migrated: false,

    setHasHydrated: (v) => set({ _hasHydrated: v }),

    loadGameState: (raw) => {
      const d = raw as Partial<GameStore> | null
      if (!d) { set({ _hasHydrated: true }); return }

      // Recompute stat values from sub-stats on load
      const player = d.player ?? null
      if (player) {
        for (const key of Object.keys(player.stats)) {
          const subs = player.stats[key]?.subStats ?? []
          player.stats[key] = { ...player.stats[key], value: recomputeStatValue(subs) }
        }
      }

      set({
        player,
        quests: d.quests ?? [],
        logs: d.logs ?? [],
        achievements: d.achievements ?? DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
        titles: d.titles ?? DEFAULT_TITLES.map(t => ({ ...t })),
        partyMembers: d.partyMembers ?? [],
        workoutPlans: d.workoutPlans ?? [],
        workoutLogs: d.workoutLogs ?? [],
        calendarEvents: d.calendarEvents ?? [],
        manualPRs: d.manualPRs ?? [],
        statConfig: d.statConfig ?? DEFAULT_STAT_CONFIG.map(c => ({ ...c })),
        _migrated: d._migrated ?? false,
        _hasHydrated: false,
      })
      get().migrateIfNeeded()
      get().resetDueHabits()
      set({ _hasHydrated: true })
    },

    initPlayer: (name) => {
      const config = get().statConfig
      set({
        player: createInitialPlayer(name, config),
        quests: [],
        logs: [],
        achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
        titles: DEFAULT_TITLES.map(t => ({ ...t })),
        _migrated: true,
      })
    },

    updatePlayerName: (name) => {
      set(s => s.player ? { player: { ...s.player, name } } : {})
    },

    equipTitle: (titleId) => {
      const { titles, player } = get()
      if (!player) return
      const title = titles.find(t => t.id === titleId)
      if (!title || !title.unlockedAt) return
      set({
        titles: titles.map(t => ({ ...t, equipped: t.id === titleId })),
        player: { ...player, title: title.name },
      })
    },

    addStat: (cfg) => {
      const key = cfg.key ?? cfg.label.toUpperCase().replace(/\s+/g, '_').slice(0, 8)
      const newCfg: StatConfig = { key, label: cfg.label, description: cfg.description, color: cfg.color }
      set(s => {
        if (s.statConfig.some(c => c.key === key)) return {}
        const newStats = s.player
          ? { ...s.player.stats, [key]: { value: 0, subStats: [] } }
          : null
        return {
          statConfig: [...s.statConfig, newCfg],
          player: s.player && newStats ? { ...s.player, stats: newStats } : s.player,
        }
      })
    },

    deleteStat: (key) => {
      set(s => {
        const newConfig = s.statConfig.filter(c => c.key !== key)
        if (!s.player) return { statConfig: newConfig }
        const newStats = { ...s.player.stats }
        delete newStats[key]
        return {
          statConfig: newConfig,
          player: { ...s.player, stats: newStats },
        }
      })
    },

    updateStatConfig: (key, updates) => {
      set(s => ({
        statConfig: s.statConfig.map(c => c.key === key ? { ...c, ...updates } : c),
      }))
    },

    awardXP: (totalXP, breakdown, subStatUpdates) => {
      const { player, achievements } = get()
      if (!player) return { leveledUp: false, tieredUp: false, newlyUnlocked: [] }

      let currentXP = player.xp + totalXP
      let newLevel = player.level
      let newTier = player.tier
      let leveledUp = false
      let tieredUp = false
      const prevLevel = player.level
      const prevTier = player.tier

      while (true) {
        const needed = calcXPToNext(newLevel, newTier)
        if (currentXP < needed) break
        currentXP -= needed
        newLevel++
        leveledUp = true
        if (newLevel > 100) {
          const next = getNextTier(newTier)
          if (next) { newTier = next; tieredUp = true; newLevel = 1 }
          // at X tier: no cap, levels continue indefinitely
        }
      }

      const newStats = { ...player.stats }
      for (const { stat, xp } of breakdown) {
        if (!newStats[stat]) continue
        const incTotal = Math.floor(xp / 10)
        const subs = newStats[stat].subStats
        if (subs.length > 0 && incTotal > 0) {
          const incPerSub = Math.max(1, Math.floor(incTotal / subs.length))
          const updated = subs.map(ss => ({ ...ss, value: ss.value + incPerSub }))
          newStats[stat] = { subStats: updated, value: recomputeStatValue(updated) }
        }
      }

      if (subStatUpdates) {
        for (const { id, increase } of subStatUpdates) {
          for (const stat of Object.keys(newStats)) {
            if (newStats[stat].subStats.some(s => s.id === id)) {
              const updated = newStats[stat].subStats.map(s =>
                s.id === id ? { ...s, value: s.value + increase } : s
              )
              newStats[stat] = { subStats: updated, value: recomputeStatValue(updated) }
            }
          }
        }
      }

      const today = getTodayDate()
      const existingSnap = (player.statHistory ?? []).find(s => s.date === today)
      const newSnapshot: StatSnapshot | null = existingSnap ? null : {
        date: today,
        stats: Object.fromEntries(Object.keys(newStats).map(k => [k, newStats[k].value])) as Record<StatKey, number>,
        totalXP: player.totalXP + totalXP,
        level: newLevel,
        tier: newTier,
      }

      const newPlayer: Player = {
        ...player,
        xp: currentXP,
        xpToNext: calcXPToNext(newLevel, newTier),
        level: newLevel,
        tier: newTier,
        totalXP: player.totalXP + totalXP,
        stats: newStats,
        statHistory: newSnapshot
          ? [...(player.statHistory ?? []), newSnapshot].slice(-365)
          : (player.statHistory ?? []),
      }

      set({ player: newPlayer })

      if (leveledUp) {
        set({ pendingLevelUp: { previousLevel: prevLevel, newLevel, previousTier: prevTier, newTier, tieredUp } })
      }

      const newlyUnlocked = get().checkAndUnlockAchievements()
      return { leveledUp, tieredUp, newlyUnlocked }
    },

    addQuest: (questData) => {
      const newQuest: Quest = { ...questData, id: generateId(), status: 'active', createdAt: new Date().toISOString() }
      set(s => ({ quests: [...s.quests, newQuest] }))
    },

    updateQuest: (questId, updates) => {
      set(s => ({ quests: s.quests.map(q => q.id === questId ? { ...q, ...updates } : q) }))
    },

    completeQuest: (questId) => {
      const now = new Date().toISOString()
      const today = getTodayDate()
      const quest = get().quests.find(q => q.id === questId)
      if (!quest) return
      const BASE_XP: Record<Quest['type'], number> = { habit: 50, today: 75, weekly: 150, yearly: 300, lifePurpose: 500 }
      const streakBonus = quest.type === 'habit' ? getStreakMultiplier(quest.streak ?? 0) : 1.0
      const totalXP = Math.round((BASE_XP[quest.type] ?? 75) * streakBonus)
      set(s => ({ quests: s.quests.map(q => q.id === questId ? {
        ...q,
        status: 'completed' as const,
        completedAt: now,
        xpAwarded: totalXP,
        // Set lastResetDate to today for habits so resetDueHabits won't re-activate on reload
        ...(q.type === 'habit' ? { lastResetDate: today } : {}),
      } : q) }))
      const allStats = (quest.linkedStats && quest.linkedStats.length > 0) ? quest.linkedStats : [quest.linkedStat]
      const xpPerStat = Math.max(1, Math.round(totalXP / allStats.length))
      const breakdown = allStats.map(stat => ({ stat, xp: xpPerStat, reasoning: `${quest.type} quest completed` }))
      get().awardXP(totalXP, breakdown)
      get().checkAndUnlockAchievements()
    },

    failQuest: (questId) => {
      set(s => ({ quests: s.quests.map(q => q.id === questId ? { ...q, status: 'failed' } : q) }))
    },

    deleteQuest: (questId) => {
      set(s => ({ quests: s.quests.filter(q => q.id !== questId) }))
    },

    updateMilestone: (questId, milestoneId, completed) => {
      set(s => ({
        quests: s.quests.map(q =>
          q.id === questId
            ? { ...q, milestones: q.milestones?.map(m => m.id === milestoneId ? { ...m, completed } : m) }
            : q
        ),
      }))
    },

    resetDueHabits: () => {
      const today = getTodayDate()
      set(s => ({
        quests: s.quests.map(q => {
          if (q.type !== 'habit' || !q.isRecurring) return q
          if (q.lastResetDate === today) return q
          // Guard using completedAt in case lastResetDate wasn't persisted before reload
          if (q.completedAt && localDateStr(new Date(q.completedAt)) === today) return q
          const prevDate = q.lastResetDate
          if (q.status === 'completed') {
            return {
              ...q, status: 'active' as const, lastResetDate: today, streak: (q.streak ?? 0) + 1,
              completionLog: prevDate ? [...(q.completionLog ?? []), { date: prevDate, status: 'completed' as const }] : (q.completionLog ?? []),
            }
          }
          if (q.status === 'failed') {
            return {
              ...q, status: 'active' as const, lastResetDate: today, streak: 0,
              completionLog: prevDate ? [...(q.completionLog ?? []), { date: prevDate, status: 'failed' as const }] : (q.completionLog ?? []),
            }
          }
          return q
        }),
      }))
    },

    submitLog: (content, completedQuestIds) => {
      const newLog: DailyLog = { id: generateId(), date: getTodayDate(), content, questsCompleted: completedQuestIds }
      set(s => ({ logs: [...s.logs, newLog] }))
      return newLog
    },

    updateLogEvaluation: (logId, evaluation) => {
      set(s => ({ logs: s.logs.map(l => l.id === logId ? { ...l, aiEvaluation: evaluation } : l) }))
      get().awardXP(evaluation.xpAwarded, evaluation.statBreakdown, evaluation.subStatUpdates)
    },

    addSubStat: (parentStat, name, description = '') => {
      const id = generateId()
      set(s => {
        if (!s.player) return {}
        const updated = [...s.player.stats[parentStat].subStats, { id, name, description, value: 1, parentStat }]
        return {
          player: {
            ...s.player,
            stats: { ...s.player.stats, [parentStat]: { subStats: updated, value: recomputeStatValue(updated) } },
          },
        }
      })
      return id
    },

    updateSubStatValue: (subStatId, newValue) => {
      set(s => {
        if (!s.player) return {}
        const newStats = { ...s.player.stats }
        for (const stat of Object.keys(newStats)) {
          if (newStats[stat].subStats.some(ss => ss.id === subStatId)) {
            const updated = newStats[stat].subStats.map(ss =>
              ss.id === subStatId ? { ...ss, value: Math.max(0, newValue) } : ss
            )
            newStats[stat] = { subStats: updated, value: recomputeStatValue(updated) }
          }
        }
        return { player: { ...s.player, stats: newStats } }
      })
    },

    updateSubStat: (subStatId, updates) => {
      set(s => {
        if (!s.player) return {}
        const newStats = { ...s.player.stats }
        for (const stat of Object.keys(newStats)) {
          if (newStats[stat].subStats.some(ss => ss.id === subStatId)) {
            const updated = newStats[stat].subStats.map(ss =>
              ss.id === subStatId
                ? { ...ss, ...updates, value: updates.value !== undefined ? Math.max(0, updates.value) : ss.value }
                : ss
            )
            newStats[stat] = { subStats: updated, value: recomputeStatValue(updated) }
          }
        }
        return { player: { ...s.player, stats: newStats } }
      })
    },

    deleteSubStat: (subStatId) => {
      set(s => {
        if (!s.player) return {}
        const newStats = { ...s.player.stats }
        for (const stat of Object.keys(newStats)) {
          if (newStats[stat].subStats.some(ss => ss.id === subStatId)) {
            const filtered = newStats[stat].subStats.filter(ss => ss.id !== subStatId)
            newStats[stat] = { subStats: filtered, value: recomputeStatValue(filtered) }
          }
        }
        return { player: { ...s.player, stats: newStats } }
      })
    },

    addPartyMember: (member) => {
      set(s => ({ partyMembers: [...s.partyMembers.filter(m => m.id !== member.id), member] }))
    },

    removePartyMember: (memberId) => {
      set(s => ({ partyMembers: s.partyMembers.filter(m => m.id !== memberId) }))
    },

    checkAndUnlockAchievements: () => {
      const { player, quests, logs, achievements } = get()
      if (!player) return []
      const newIds = checkAchievements(player, quests, logs, achievements)
      if (newIds.length === 0) return []
      const now = new Date().toISOString()
      set(s => ({
        achievements: s.achievements.map(a => newIds.includes(a.id) && !a.unlockedAt ? { ...a, unlockedAt: now } : a),
        titles: s.titles.map(t => newIds.includes(t.achievementId) && !t.unlockedAt ? { ...t, unlockedAt: now } : t),
      }))
      return newIds
    },

    addWorkoutPlan: (plan) => {
      const newPlan: WorkoutPlan = { ...plan, id: generateId(), createdAt: new Date().toISOString() }
      set(s => ({ workoutPlans: [...s.workoutPlans, newPlan] }))
    },

    updateWorkoutPlan: (planId, updates) => {
      set(s => ({ workoutPlans: s.workoutPlans.map(p => p.id === planId ? { ...p, ...updates } : p) }))
    },

    deleteWorkoutPlan: (planId) => {
      set(s => ({ workoutPlans: s.workoutPlans.filter(p => p.id !== planId) }))
    },

    unlockQuest: (questId) => {
      const quest = get().quests.find(q => q.id === questId)
      if (!quest) return
      // Revert to active, keep lastResetDate=today for habits so resetDueHabits skips it
      set(s => ({ quests: s.quests.map(q => q.id === questId ? {
        ...q,
        status: 'active' as const,
        completedAt: undefined,
        xpAwarded: undefined,
      } : q) }))
      // Reverse XP from player totals (best-effort: deduct from xp and totalXP)
      const xp = quest.xpAwarded ?? 0
      if (xp > 0) {
        set(s => {
          if (!s.player) return {}
          return { player: {
            ...s.player,
            xp: Math.max(0, s.player.xp - xp),
            totalXP: Math.max(0, s.player.totalXP - xp),
          }}
        })
      }
    },

    logWorkout: (log) => {
      const newLog: WorkoutLog = { ...log, id: generateId() }
      set(s => ({ workoutLogs: [...s.workoutLogs, newLog] }))
      const uniqueMuscles = [...new Set(log.exercises.flatMap(e => e.muscleGroups))]
      const totalSets = log.exercises.reduce((sum, e) => sum + e.sets.length, 0)
      const xp = Math.min(200, Math.round(uniqueMuscles.length * 12 + totalSets * 6))
      if (xp > 0) {
        get().awardXP(xp, [{ stat: 'PHY', xp, reasoning: `Workout: ${uniqueMuscles.length} muscle groups, ${totalSets} sets` }])
      }
    },

    deleteWorkoutLog: (logId) => {
      set(s => ({ workoutLogs: s.workoutLogs.filter(l => l.id !== logId) }))
    },

    addCalendarEvent: (event) => {
      const newEvent: CalendarEvent = { ...event, id: generateId() }
      set(s => ({ calendarEvents: [...s.calendarEvents, newEvent] }))
    },

    deleteCalendarEvent: (id) => {
      set(s => ({ calendarEvents: s.calendarEvents.filter(e => e.id !== id) }))
    },

    addManualPR: (pr) => {
      const newPR: ManualPR = { ...pr, id: generateId() }
      set(s => ({ manualPRs: [...s.manualPRs, newPR] }))
    },

    deleteManualPR: (id) => {
      set(s => ({ manualPRs: s.manualPRs.filter(p => p.id !== id) }))
    },

    snapshotStatHistory: () => {
      const { player } = get()
      if (!player) return
      const today = getTodayDate()
      if ((player.statHistory ?? []).find(s => s.date === today)) return
      const snapshot: StatSnapshot = {
        date: today,
        stats: Object.fromEntries(Object.keys(player.stats).map(k => [k, player.stats[k].value])) as Record<StatKey, number>,
        totalXP: player.totalXP,
        level: player.level,
        tier: player.tier,
      }
      set(s => ({
        player: s.player ? { ...s.player, statHistory: [...(s.player.statHistory ?? []), snapshot].slice(-365) } : null,
      }))
    },

    clearPendingLevelUp: () => set({ pendingLevelUp: null }),

    migrateIfNeeded: () => {
      const state = get()
      if (state._migrated) return
      if (!state.player) { set({ _migrated: true }); return }

      const oldStats = state.player.stats as Record<string, StatBlock>
      if (!('STR' in oldStats)) {
        const { activeDebuffs: _removed, ...clean } = state.player as Player & { activeDebuffs?: unknown }
        set({ _migrated: true, player: { ...clean, statHistory: state.player.statHistory ?? [] } })
        return
      }

      const emptyBlock = (): StatBlock => ({ value: 0, subStats: [] })
      const newStats: Record<string, StatBlock> = {
        INT: { value: oldStats['INT']?.value ?? 0, subStats: [...(oldStats['INT']?.subStats ?? []), ...(oldStats['WIS']?.subStats ?? []).map((ss: SubStat) => ({ ...ss, parentStat: 'INT' as StatKey }))] },
        PHY: { value: Math.max(oldStats['STR']?.value ?? 0, oldStats['AGI']?.value ?? 0, oldStats['END']?.value ?? 0), subStats: [...(oldStats['STR']?.subStats ?? []), ...(oldStats['AGI']?.subStats ?? []), ...(oldStats['END']?.subStats ?? [])].map((ss: SubStat) => ({ ...ss, parentStat: 'PHY' as StatKey })) },
        WLT: emptyBlock(),
        CHA: { value: oldStats['CHA']?.value ?? 0, subStats: oldStats['CHA']?.subStats ?? [] },
        CRF: emptyBlock(),
      }

      const oldToNewQuestType: Record<string, Quest['type']> = { daily: 'habit', side: 'weekly', main: 'yearly' }
      const { activeDebuffs: _removed, ...playerWithoutDebuffs } = state.player as Player & { activeDebuffs?: unknown }

      set({
        _migrated: true,
        player: { ...playerWithoutDebuffs, stats: newStats, statHistory: state.player.statHistory ?? [] },
        quests: state.quests.map(q => ({ ...q, type: (oldToNewQuestType[q.type] ?? q.type) as Quest['type'] })),
      })
    },

    // Preserves stat keys, sub-stat names, workout plans — only resets progress
    resetGame: () => {
      const { player, workoutPlans, statConfig } = get()
      if (!player) {
        set({
          achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
          titles: DEFAULT_TITLES.map(t => ({ ...t })),
          partyMembers: [], workoutLogs: [], calendarEvents: [], pendingLevelUp: null,
        })
        return
      }

      // Zero all sub-stat values but preserve names/descriptions
      const preservedStats: Record<string, StatBlock> = {}
      for (const key of Object.keys(player.stats)) {
        preservedStats[key] = {
          value: 0,
          subStats: player.stats[key].subStats.map(ss => ({ ...ss, value: 0 })),
        }
      }

      set({
        player: {
          ...player,
          tier: 'F', level: 1, xp: 0,
          xpToNext: calcXPToNext(1, 'F'),
          totalXP: 0, stats: preservedStats, statHistory: [],
        },
        quests: [],
        logs: [],
        achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
        titles: DEFAULT_TITLES.map(t => ({ ...t })),
        partyMembers: [],
        workoutLogs: [],
        calendarEvents: [],
        pendingLevelUp: null,
        // Preserved: workoutPlans, statConfig, manualPRs
      })
    },

    exportProfile: () => {
      const { player, quests, achievements, titles, logs } = get()
      return JSON.stringify({
        id: player?.id || generateId(),
        name: player?.name || 'Unknown',
        profile: player,
        quests, achievements, titles,
        logs: logs.slice(-7),
        lastUpdated: new Date().toISOString(),
      }, null, 2)
    },
  })
)
