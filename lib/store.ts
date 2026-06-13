import { create } from 'zustand'
import {
  Player, Quest, DailyLog, Achievement, Title, PartyMember,
  LevelUpData, StatKey, AIEvaluation, StatBlock, SubStat, StatSnapshot,
} from './types'
import {
  calcXPToNext, getNextTier, generateId, getTodayDate,
  checkAchievements, ALL_STAT_KEYS, getStreakMultiplier,
} from './gameLogic'
import { createInitialPlayer, DEFAULT_ACHIEVEMENTS, DEFAULT_TITLES } from './defaultData'

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

  setHasHydrated: (v: boolean) => void
  loadGameState: (data: unknown) => void
  initPlayer: (name: string) => void
  updatePlayerName: (name: string) => void
  equipTitle: (titleId: string) => void

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

  snapshotStatHistory: () => void
  checkAndUnlockAchievements: () => string[]
  clearPendingLevelUp: () => void
  migrateIfNeeded: () => void
  resetGame: () => void
  exportProfile: () => string
}

export const useGameStore = create<GameStore>()(
  (set, get) => ({
      player: null,
      quests: [],
      logs: [],
      achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
      titles: DEFAULT_TITLES.map(t => ({ ...t })),
      partyMembers: [],
      pendingLevelUp: null,
      _hasHydrated: false,
      _migrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      loadGameState: (raw) => {
        const d = raw as Partial<GameStore> | null
        if (!d) {
          set({ _hasHydrated: true })
          return
        }
        set({
          player: d.player ?? null,
          quests: d.quests ?? [],
          logs: d.logs ?? [],
          achievements: d.achievements ?? DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
          titles: d.titles ?? DEFAULT_TITLES.map(t => ({ ...t })),
          partyMembers: d.partyMembers ?? [],
          _migrated: d._migrated ?? false,
          _hasHydrated: false,
        })
        get().migrateIfNeeded()
        get().resetDueHabits()
        set({ _hasHydrated: true })
      },

      initPlayer: (name) => {
        set({
          player: createInitialPlayer(name),
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

      awardXP: (totalXP, breakdown, subStatUpdates) => {
        const { player, logs, achievements, titles } = get()
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
            if (next) { newTier = next; tieredUp = true }
            else { newLevel = 100 }
          }
        }

        const newStats = { ...player.stats }
        for (const { stat, xp } of breakdown) {
          if (!newStats[stat]) continue
          const inc = Math.floor(xp / 10)
          newStats[stat] = {
            ...newStats[stat],
            value: Math.min(999, newStats[stat].value + inc),
          }
        }

        if (subStatUpdates) {
          for (const { id, increase } of subStatUpdates) {
            for (const stat of ALL_STAT_KEYS) {
              const ss = newStats[stat].subStats.find(s => s.id === id)
              if (ss) {
                newStats[stat] = {
                  ...newStats[stat],
                  subStats: newStats[stat].subStats.map(s =>
                    s.id === id ? { ...s, value: Math.min(100, s.value + increase) } : s
                  ),
                }
              }
            }
          }
        }

        const today = getTodayDate()
        const existingSnap = (player.statHistory ?? []).find(s => s.date === today)
        const newSnapshot: StatSnapshot | null = existingSnap ? null : {
          date: today,
          stats: Object.fromEntries(ALL_STAT_KEYS.map(k => [k, newStats[k].value])) as Record<StatKey, number>,
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
          set({
            pendingLevelUp: {
              previousLevel: prevLevel,
              newLevel,
              previousTier: prevTier,
              newTier,
              tieredUp,
            },
          })
        }

        const newlyUnlocked = get().checkAndUnlockAchievements()
        return { leveledUp, tieredUp, newlyUnlocked }
      },

      addQuest: (questData) => {
        const newQuest: Quest = {
          ...questData,
          id: generateId(),
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        set(s => ({ quests: [...s.quests, newQuest] }))
      },

      updateQuest: (questId, updates) => {
        set(s => ({
          quests: s.quests.map(q =>
            q.id === questId ? { ...q, ...updates } : q
          ),
        }))
      },

      completeQuest: (questId) => {
        const now = new Date().toISOString()
        const quest = get().quests.find(q => q.id === questId)
        if (!quest) return

        set(s => ({
          quests: s.quests.map(q =>
            q.id === questId ? { ...q, status: 'completed', completedAt: now } : q
          ),
        }))

        const BASE_XP: Record<Quest['type'], number> = {
          habit: 50, today: 75, weekly: 150, yearly: 300, lifePurpose: 500,
        }
        const streakBonus = quest.type === 'habit' ? getStreakMultiplier(quest.streak ?? 0) : 1.0
        const totalXP = Math.round((BASE_XP[quest.type] ?? 75) * streakBonus)

        get().awardXP(totalXP, [{
          stat: quest.linkedStat,
          xp: totalXP,
          reasoning: `${quest.type} quest completed`,
        }])
        get().checkAndUnlockAchievements()
      },

      failQuest: (questId) => {
        set(s => ({
          quests: s.quests.map(q =>
            q.id === questId ? { ...q, status: 'failed' } : q
          ),
        }))
      },

      deleteQuest: (questId) => {
        set(s => ({ quests: s.quests.filter(q => q.id !== questId) }))
      },

      updateMilestone: (questId, milestoneId, completed) => {
        set(s => ({
          quests: s.quests.map(q =>
            q.id === questId
              ? {
                  ...q,
                  milestones: q.milestones?.map(m =>
                    m.id === milestoneId ? { ...m, completed } : m
                  ),
                }
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
            const prevDate = q.lastResetDate
            if (q.status === 'completed') {
              return {
                ...q,
                status: 'active' as const,
                lastResetDate: today,
                streak: (q.streak ?? 0) + 1,
                completionLog: prevDate
                  ? [...(q.completionLog ?? []), { date: prevDate, status: 'completed' as const }]
                  : (q.completionLog ?? []),
              }
            }
            if (q.status === 'failed') {
              return {
                ...q,
                status: 'active' as const,
                lastResetDate: today,
                streak: 0,
                completionLog: prevDate
                  ? [...(q.completionLog ?? []), { date: prevDate, status: 'failed' as const }]
                  : (q.completionLog ?? []),
              }
            }
            return q
          }),
        }))
      },

      submitLog: (content, completedQuestIds) => {
        const newLog: DailyLog = {
          id: generateId(),
          date: getTodayDate(),
          content,
          questsCompleted: completedQuestIds,
        }
        set(s => ({ logs: [...s.logs, newLog] }))
        return newLog
      },

      updateLogEvaluation: (logId, evaluation) => {
        set(s => ({
          logs: s.logs.map(l =>
            l.id === logId ? { ...l, aiEvaluation: evaluation } : l
          ),
        }))
        get().awardXP(evaluation.xpAwarded, evaluation.statBreakdown, evaluation.subStatUpdates)
      },

      addSubStat: (parentStat, name, description = '') => {
        const id = generateId()
        set(s => ({
          player: s.player
            ? {
                ...s.player,
                stats: {
                  ...s.player.stats,
                  [parentStat]: {
                    ...s.player.stats[parentStat],
                    subStats: [
                      ...s.player.stats[parentStat].subStats,
                      { id, name, description, value: 1, parentStat },
                    ],
                  },
                },
              }
            : null,
        }))
        return id
      },

      updateSubStatValue: (subStatId, newValue) => {
        set(s => {
          if (!s.player) return {}
          const newStats = { ...s.player.stats }
          for (const stat of ALL_STAT_KEYS) {
            const idx = newStats[stat].subStats.findIndex(ss => ss.id === subStatId)
            if (idx !== -1) {
              newStats[stat] = {
                ...newStats[stat],
                subStats: newStats[stat].subStats.map(ss =>
                  ss.id === subStatId ? { ...ss, value: Math.min(100, Math.max(1, newValue)) } : ss
                ),
              }
            }
          }
          return { player: { ...s.player, stats: newStats } }
        })
      },

      updateSubStat: (subStatId, updates) => {
        set(s => {
          if (!s.player) return {}
          const newStats = { ...s.player.stats }
          for (const stat of ALL_STAT_KEYS) {
            const idx = newStats[stat].subStats.findIndex(ss => ss.id === subStatId)
            if (idx !== -1) {
              newStats[stat] = {
                ...newStats[stat],
                subStats: newStats[stat].subStats.map(ss =>
                  ss.id === subStatId
                    ? {
                        ...ss,
                        ...updates,
                        value: updates.value !== undefined
                          ? Math.min(100, Math.max(1, updates.value))
                          : ss.value,
                      }
                    : ss
                ),
              }
            }
          }
          return { player: { ...s.player, stats: newStats } }
        })
      },

      deleteSubStat: (subStatId) => {
        set(s => {
          if (!s.player) return {}
          const newStats = { ...s.player.stats }
          for (const stat of ALL_STAT_KEYS) {
            newStats[stat] = {
              ...newStats[stat],
              subStats: newStats[stat].subStats.filter(ss => ss.id !== subStatId),
            }
          }
          return { player: { ...s.player, stats: newStats } }
        })
      },

      addPartyMember: (member) => {
        set(s => ({
          partyMembers: [...s.partyMembers.filter(m => m.id !== member.id), member],
        }))
      },

      removePartyMember: (memberId) => {
        set(s => ({ partyMembers: s.partyMembers.filter(m => m.id !== memberId) }))
      },

      checkAndUnlockAchievements: () => {
        const { player, quests, logs, achievements, titles } = get()
        if (!player) return []
        const newIds = checkAchievements(player, quests, logs, achievements)
        if (newIds.length === 0) return []

        const now = new Date().toISOString()
        set(s => ({
          achievements: s.achievements.map(a =>
            newIds.includes(a.id) && !a.unlockedAt ? { ...a, unlockedAt: now } : a
          ),
          titles: s.titles.map(t =>
            newIds.includes(t.achievementId) && !t.unlockedAt ? { ...t, unlockedAt: now } : t
          ),
        }))
        return newIds
      },

      snapshotStatHistory: () => {
        const { player } = get()
        if (!player) return
        const today = getTodayDate()
        const existing = (player.statHistory ?? []).find(s => s.date === today)
        if (existing) return
        const snapshot: StatSnapshot = {
          date: today,
          stats: Object.fromEntries(ALL_STAT_KEYS.map(k => [k, player.stats[k].value])) as Record<StatKey, number>,
          totalXP: player.totalXP,
          level: player.level,
          tier: player.tier,
        }
        set(s => ({
          player: s.player ? {
            ...s.player,
            statHistory: [...(s.player.statHistory ?? []), snapshot].slice(-365),
          } : null,
        }))
      },

      clearPendingLevelUp: () => set({ pendingLevelUp: null }),

      migrateIfNeeded: () => {
        const state = get()
        if (state._migrated) return
        if (!state.player) {
          set({ _migrated: true })
          return
        }

        const oldStats = state.player.stats as Record<string, StatBlock>
        if (!('STR' in oldStats)) {
          // Strip legacy activeDebuffs field if present
          const { activeDebuffs: _removed, ...clean } = state.player as Player & { activeDebuffs?: unknown }
          set({ _migrated: true, player: { ...clean, statHistory: state.player.statHistory ?? [] } })
          return
        }

        const emptyBlock = (): StatBlock => ({ value: 1, subStats: [] })
        const oldToNewStat: Record<string, StatKey> = {
          STR: 'PHY', AGI: 'PHY', END: 'PHY', WIS: 'INT', INT: 'INT', CHA: 'CHA',
        }

        const newStats: Record<StatKey, StatBlock> = {
          INT: {
            value: oldStats['INT']?.value ?? 1,
            subStats: [
              ...(oldStats['INT']?.subStats ?? []).map((ss: SubStat) => ({
                ...ss,
                description: (ss as SubStat & { description?: string }).description ?? '',
              })),
              ...(oldStats['WIS']?.subStats ?? []).map((ss: SubStat) => ({
                ...ss,
                description: (ss as SubStat & { description?: string }).description ?? '',
                parentStat: 'INT' as StatKey,
              })),
            ],
          },
          PHY: {
            value: Math.max(
              oldStats['STR']?.value ?? 1,
              oldStats['AGI']?.value ?? 1,
              oldStats['END']?.value ?? 1
            ),
            subStats: [
              ...(oldStats['STR']?.subStats ?? []).map((ss: SubStat) => ({
                ...ss,
                description: (ss as SubStat & { description?: string }).description ?? '',
                parentStat: 'PHY' as StatKey,
              })),
              ...(oldStats['AGI']?.subStats ?? []).map((ss: SubStat) => ({
                ...ss,
                description: (ss as SubStat & { description?: string }).description ?? '',
                parentStat: 'PHY' as StatKey,
              })),
              ...(oldStats['END']?.subStats ?? []).map((ss: SubStat) => ({
                ...ss,
                description: (ss as SubStat & { description?: string }).description ?? '',
                parentStat: 'PHY' as StatKey,
              })),
            ],
          },
          WLT: emptyBlock(),
          CHA: {
            value: oldStats['CHA']?.value ?? 1,
            subStats: (oldStats['CHA']?.subStats ?? []).map((ss: SubStat) => ({
              ...ss,
              description: (ss as SubStat & { description?: string }).description ?? '',
            })),
          },
          CRF: emptyBlock(),
        }

        const oldToNewQuestType: Record<string, Quest['type']> = {
          daily: 'habit',
          side: 'weekly',
          main: 'yearly',
        }

        const { activeDebuffs: _removed, ...playerWithoutDebuffs } = state.player as Player & { activeDebuffs?: unknown }

        set({
          _migrated: true,
          player: { ...playerWithoutDebuffs, stats: newStats, statHistory: state.player.statHistory ?? [] },
          quests: state.quests.map(q => ({
            ...q,
            linkedStat: (oldToNewStat[q.linkedStat] ?? q.linkedStat) as StatKey,
            type: (oldToNewQuestType[q.type] ?? q.type) as Quest['type'],
          })),
        })
      },

      resetGame: () => {
        set({
          player: null,
          quests: [],
          logs: [],
          achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
          titles: DEFAULT_TITLES.map(t => ({ ...t })),
          partyMembers: [],
          pendingLevelUp: null,
          _migrated: false,
        })
      },

      exportProfile: () => {
        const { player, quests, achievements, titles, logs } = get()
        return JSON.stringify({
          id: player?.id || generateId(),
          name: player?.name || 'Unknown',
          profile: player,
          quests,
          achievements,
          titles,
          logs: logs.slice(-7),
          lastUpdated: new Date().toISOString(),
        }, null, 2)
      },
  })
)
