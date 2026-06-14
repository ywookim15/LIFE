import { create } from 'zustand'
import {
  Player, Quest, DailyLog, Achievement, Title, PartyMember,
  LevelUpData, StatKey, AIEvaluation, StatBlock, SubStat, StatSnapshot,
  WorkoutPlan, WorkoutLog, StatConfig, CalendarEvent, ManualPR,
} from './types'
import {
  calcXPToNext, getTierFromLevel, TIER_ORDER, generateId, getTodayDate,
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
  _subStatV2: boolean
  _levelV2: boolean
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
  migrateLevels: () => void
  recalibrateSubs: () => void
  setCustomTitle: (title: string) => void
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
    _subStatV2: false,
    _levelV2: false,

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

      const subStatV2 = (d as Record<string, unknown>)._subStatV2 === true
      const levelV2 = (d as Record<string, unknown>)._levelV2 === true

      // Merge saved achievements with new defaults (preserve unlocked state, add new ones)
      const savedAchievements = (d.achievements ?? []) as Achievement[]
      const mergedAchievements = DEFAULT_ACHIEVEMENTS.map(def => {
        const saved = savedAchievements.find(a => a.id === def.id)
        return saved ?? { ...def }
      })
      const savedTitles = (d.titles ?? []) as Title[]
      const mergedTitles = DEFAULT_TITLES.map(def => {
        const saved = savedTitles.find(t => t.id === def.id)
        return saved ?? { ...def }
      })

      set({
        player,
        quests: d.quests ?? [],
        logs: d.logs ?? [],
        achievements: mergedAchievements,
        titles: mergedTitles,
        partyMembers: d.partyMembers ?? [],
        workoutPlans: d.workoutPlans ?? [],
        workoutLogs: d.workoutLogs ?? [],
        calendarEvents: d.calendarEvents ?? [],
        manualPRs: d.manualPRs ?? [],
        statConfig: d.statConfig ?? DEFAULT_STAT_CONFIG.map(c => ({ ...c })),
        _migrated: d._migrated ?? false,
        _subStatV2: subStatV2,
        _levelV2: levelV2,
        _hasHydrated: false,
      })
      get().migrateIfNeeded()
      get().resetDueHabits()
      if (!subStatV2) {
        get().recalibrateSubs()
        set({ _subStatV2: true })
      }
      if (!levelV2) {
        get().migrateLevels()
        set({ _levelV2: true })
      }
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

      while (currentXP >= calcXPToNext()) {
        currentXP -= calcXPToNext()
        newLevel++
        leveledUp = true

        if (newTier !== 'X') {
          const derived = getTierFromLevel(newLevel)
          if (derived !== newTier) {
            newTier = derived
            tieredUp = true
            if (newTier === 'X') {
              // Prestige: reset level to 1 upon first reaching tier X
              newLevel = 1
              currentXP = 0
              break
            }
          }
        }
        // At tier X: levels increment indefinitely
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
        xpToNext: calcXPToNext(),
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

    migrateLevels: () => {
      const { player } = get()
      if (!player) return
      // Convert old per-tier level (1-100) to continuous absolute level (1-900)
      const tierIdx = TIER_ORDER.indexOf(player.tier)
      if (tierIdx < 0) return
      const absoluteLevel = player.tier === 'X'
        ? player.level  // already handled post-prestige or pre-prestige — don't re-convert
        : tierIdx * 100 + player.level
      set(s => ({
        player: s.player ? { ...s.player, level: absoluteLevel, xp: 0, xpToNext: 100 } : null,
      }))
    },

    setCustomTitle: (title: string) => {
      set(s => {
        if (!s.player) return {}
        return {
          titles: s.titles.map(t => ({ ...t, equipped: false })),
          player: { ...s.player, customTitle: title, title },
        }
      })
    },

    checkAndUnlockAchievements: () => {
      const { player, quests, logs, achievements, workoutLogs, manualPRs, partyMembers } = get()
      if (!player) return []
      const newIds = checkAchievements(player, quests, logs, achievements, workoutLogs, manualPRs, partyMembers)
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

      const { player } = get()
      let gymSets = 0, calistSets = 0, cardioSets = 0
      for (const ex of log.exercises) {
        const n = ex.sets.length
        if (ex.exerciseType === 'calisthenics') calistSets += n
        else if (ex.exerciseType === 'cardio') cardioSets += n
        else gymSets += n
      }
      const uniqueMuscles = [...new Set(log.exercises.flatMap(e => e.muscleGroups))]
      const totalSets = gymSets + calistSets + cardioSets
      const totalXP = Math.min(200, Math.round(uniqueMuscles.length * 12 + totalSets * 6))
      if (totalXP === 0) return

      // Target specific PHY sub-stats by exercise type keyword
      const phySubs = player?.stats['PHY']?.subStats ?? []
      const kwIds = (kws: string[]) =>
        phySubs.filter(ss => kws.some(kw => ss.name.toLowerCase().includes(kw))).map(s => s.id)
      const fallbackIds = phySubs.map(s => s.id)
      const strengthIds = kwIds(['strength'])
      const calistIds = kwIds(['calisthenics', 'calisthenic'])
      const cardioIds = kwIds(['cardio', 'cardiovascular', 'endurance'])

      const subStatUpdates: { id: string; increase: number }[] = []
      const addIds = (ids: string[], totalPts: number) => {
        if (ids.length === 0 || totalPts === 0) return
        const perSub = Math.max(1, Math.floor(totalPts / ids.length))
        for (const id of ids) subStatUpdates.push({ id, increase: perSub })
      }
      if (gymSets > 0) addIds(strengthIds.length ? strengthIds : fallbackIds, Math.ceil(gymSets / 2))
      if (calistSets > 0) addIds(calistIds.length ? calistIds : fallbackIds, Math.ceil(calistSets / 2))
      if (cardioSets > 0) addIds(cardioIds.length ? cardioIds : fallbackIds, Math.ceil(cardioSets / 2))

      // Pass empty breakdown so awardXP doesn't do equal sub-stat distribution;
      // all sub-stat increases come from the targeted subStatUpdates above.
      get().awardXP(
        totalXP,
        [{ stat: 'PHY' as const, xp: 0, reasoning: `Workout: ${uniqueMuscles.length} muscle groups, ${totalSets} sets` }],
        subStatUpdates.length > 0 ? subStatUpdates : undefined,
      )
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

    // Rebuild sub-stat values from scratch using quest completions + workout logs.
    // Gym → strength subs, calisthenics → calisthenics subs, cardio → cardio/endurance subs.
    recalibrateSubs: () => {
      const { player, quests, workoutLogs } = get()
      if (!player) return

      // Zero all sub-stat values, preserving structure
      const newStats: Record<string, StatBlock> = {}
      for (const key of Object.keys(player.stats)) {
        newStats[key] = {
          value: 0,
          subStats: player.stats[key].subStats.map(ss => ({ ...ss, value: 0 })),
        }
      }

      // Helper: add points to a list of sub-stat IDs in newStats
      const addById = (ids: string[], totalPoints: number) => {
        if (ids.length === 0 || totalPoints === 0) return
        const perSub = Math.max(1, Math.floor(totalPoints / ids.length))
        for (const id of ids) {
          for (const key of Object.keys(newStats)) {
            const idx = newStats[key].subStats.findIndex(s => s.id === id)
            if (idx >= 0) {
              const subs = [...newStats[key].subStats]
              subs[idx] = { ...subs[idx], value: subs[idx].value + perSub }
              newStats[key] = { ...newStats[key], subStats: subs }
            }
          }
        }
      }

      // Pre-compute PHY sub-stat ID sets for workout type targeting
      const phySubs = newStats['PHY']?.subStats ?? []
      const kwIds = (kws: string[]) =>
        phySubs.filter(ss => kws.some(kw => ss.name.toLowerCase().includes(kw))).map(s => s.id)
      const fallbackIds = phySubs.map(s => s.id)
      const strengthIds = kwIds(['strength'])
      const calistIds = kwIds(['calisthenics', 'calisthenic'])
      const cardioIds = kwIds(['cardio', 'cardiovascular', 'endurance'])

      // Replay quest completions (equal distribution across linked stat's sub-stats)
      for (const q of quests) {
        if (!q.xpAwarded) continue
        const allStats = (q.linkedStats && q.linkedStats.length > 0) ? q.linkedStats : [q.linkedStat]
        const xpPerStat = Math.max(1, Math.round(q.xpAwarded / allStats.length))
        for (const stat of allStats) {
          if (!newStats[stat]) continue
          const ids = newStats[stat].subStats.map(s => s.id)
          addById(ids, Math.floor(xpPerStat / 10))
        }
      }

      // Replay workout logs with targeted sub-stat distribution
      for (const log of workoutLogs) {
        let gymSets = 0, calistSets = 0, cardioSets = 0
        for (const ex of log.exercises) {
          const n = ex.sets.length
          if (ex.exerciseType === 'calisthenics') calistSets += n
          else if (ex.exerciseType === 'cardio') cardioSets += n
          else gymSets += n
        }
        if (gymSets > 0) addById(strengthIds.length ? strengthIds : fallbackIds, Math.ceil(gymSets / 2))
        if (calistSets > 0) addById(calistIds.length ? calistIds : fallbackIds, Math.ceil(calistSets / 2))
        if (cardioSets > 0) addById(cardioIds.length ? cardioIds : fallbackIds, Math.ceil(cardioSets / 2))
      }

      // Recompute stat total values
      for (const key of Object.keys(newStats)) {
        newStats[key] = { ...newStats[key], value: recomputeStatValue(newStats[key].subStats) }
      }

      set(s => ({ player: s.player ? { ...s.player, stats: newStats } : null }))
    },

    // Resets XP/levels/history. Keeps quests (reset to active), skills, plans, calendar.
    resetGame: () => {
      const { player, quests } = get()
      if (!player) {
        set({
          achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
          titles: DEFAULT_TITLES.map(t => ({ ...t })),
          partyMembers: [], workoutLogs: [], pendingLevelUp: null,
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
          xpToNext: 100,
          totalXP: 0, stats: preservedStats, statHistory: [],
        },
        // Reset quest/habit completion history, keep definitions and structure
        quests: quests.map(q => ({
          ...q,
          status: 'active' as const,
          completedAt: undefined,
          xpAwarded: undefined,
          streak: 0,
          completionLog: [],
          lastResetDate: undefined,
          milestones: q.milestones?.map(m => ({ ...m, completed: false })),
        })),
        logs: [],
        achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
        titles: DEFAULT_TITLES.map(t => ({ ...t })),
        partyMembers: [],
        workoutLogs: [],
        pendingLevelUp: null,
        _subStatV2: true,
        // Preserved: workoutPlans, statConfig, calendarEvents, manualPRs
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
