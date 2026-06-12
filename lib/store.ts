import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  Player, Quest, DailyLog, Achievement, Title, PartyMember,
  Debuff, LevelUpData, StatKey, AIEvaluation, Milestone,
} from './types'
import {
  calcXPToNext, getNextTier, generateId, getTodayDate,
  checkAchievements, ALL_STAT_KEYS,
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
  clearedDebuffCount: number
  _hasHydrated: boolean

  setHasHydrated: (v: boolean) => void
  initPlayer: (name: string) => void
  updatePlayerName: (name: string) => void
  equipTitle: (titleId: string) => void

  awardXP: (
    totalXP: number,
    breakdown: { stat: StatKey; xp: number }[],
    subStatUpdates?: { id: string; increase: number }[]
  ) => { leveledUp: boolean; tieredUp: boolean; newlyUnlocked: string[] }

  addQuest: (quest: Omit<Quest, 'id' | 'createdAt' | 'status'>) => void
  completeQuest: (questId: string) => void
  failQuest: (questId: string) => void
  deleteQuest: (questId: string) => void
  updateMilestone: (questId: string, milestoneId: string, completed: boolean) => void

  applyDebuff: (debuff: Omit<Debuff, 'id' | 'appliedAt'>) => void
  liftDebuff: (debuffId: string) => void

  submitLog: (content: string, completedQuestIds: string[]) => DailyLog
  updateLogEvaluation: (logId: string, evaluation: AIEvaluation) => void

  addSubStat: (parentStat: StatKey, name: string) => string
  updateSubStatValue: (subStatId: string, newValue: number) => void

  addPartyMember: (member: PartyMember) => void
  removePartyMember: (memberId: string) => void

  checkAndUnlockAchievements: () => string[]
  clearPendingLevelUp: () => void
  resetGame: () => void
  exportProfile: () => string
}

const safeLocalStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(name)
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(name, value)
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(name)
  },
}))

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: null,
      quests: [],
      logs: [],
      achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
      titles: DEFAULT_TITLES.map(t => ({ ...t })),
      partyMembers: [],
      pendingLevelUp: null,
      clearedDebuffCount: 0,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      initPlayer: (name) => {
        set({
          player: createInitialPlayer(name),
          quests: [],
          logs: [],
          achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
          titles: DEFAULT_TITLES.map(t => ({ ...t })),
          clearedDebuffCount: 0,
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
        const { player, logs, achievements, titles, clearedDebuffCount } = get()
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
          const inc = Math.floor(xp / 10)
          newStats[stat] = {
            ...newStats[stat],
            value: Math.min(999, newStats[stat].value + inc),
          }
        }

        // Apply sub-stat updates from AI
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

        const newPlayer: Player = {
          ...player,
          xp: currentXP,
          xpToNext: calcXPToNext(newLevel, newTier),
          level: newLevel,
          tier: newTier,
          totalXP: player.totalXP + totalXP,
          stats: newStats,
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

      completeQuest: (questId) => {
        const now = new Date().toISOString()
        set(s => ({
          quests: s.quests.map(q =>
            q.id === questId ? { ...q, status: 'completed', completedAt: now } : q
          ),
        }))
        get().checkAndUnlockAchievements()
      },

      failQuest: (questId) => {
        const { quests } = get()
        const quest = quests.find(q => q.id === questId)
        if (!quest) return
        set(s => ({
          quests: s.quests.map(q =>
            q.id === questId ? { ...q, status: 'failed' } : q
          ),
        }))
        // Auto-apply debuff for failed daily quest
        if (quest.type === 'daily') {
          get().applyDebuff({
            name: `${quest.linkedStat} DEBUFF`,
            description: `Failed daily quest: "${quest.title}"`,
            affectedStat: quest.linkedStat,
            penalty: 5,
            clearCondition: `Complete 3 active ${quest.linkedStat} quests`,
          })
        }
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

      applyDebuff: (debuffData) => {
        const { player } = get()
        if (!player) return
        const newDebuff: Debuff = {
          ...debuffData,
          id: generateId(),
          appliedAt: new Date().toISOString(),
        }
        set(s => ({
          player: s.player
            ? { ...s.player, activeDebuffs: [...s.player.activeDebuffs, newDebuff] }
            : null,
        }))
      },

      liftDebuff: (debuffId) => {
        const { player } = get()
        if (!player) return
        const now = new Date().toISOString()
        set(s => ({
          player: s.player
            ? {
                ...s.player,
                activeDebuffs: s.player.activeDebuffs.map(d =>
                  d.id === debuffId ? { ...d, clearedAt: now } : d
                ).filter(d => d.id !== debuffId),
              }
            : null,
          clearedDebuffCount: s.clearedDebuffCount + 1,
        }))
        get().checkAndUnlockAchievements()
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

        // Apply debuffs from evaluation
        for (const debuff of evaluation.debuffsApplied) {
          const newDebuff: Debuff = {
            ...debuff,
            appliedAt: new Date().toISOString(),
          }
          set(s => ({
            player: s.player
              ? { ...s.player, activeDebuffs: [...s.player.activeDebuffs, newDebuff] }
              : null,
          }))
        }

        // Lift debuffs from evaluation
        for (const id of evaluation.debuffsLifted) {
          get().liftDebuff(id)
        }

        // Award XP
        get().awardXP(evaluation.xpAwarded, evaluation.statBreakdown, evaluation.subStatUpdates)
      },

      addSubStat: (parentStat, name) => {
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
                      { id, name, value: 1, parentStat },
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

      addPartyMember: (member) => {
        set(s => ({
          partyMembers: [...s.partyMembers.filter(m => m.id !== member.id), member],
        }))
      },

      removePartyMember: (memberId) => {
        set(s => ({ partyMembers: s.partyMembers.filter(m => m.id !== memberId) }))
      },

      checkAndUnlockAchievements: () => {
        const { player, quests, logs, achievements, titles, clearedDebuffCount } = get()
        if (!player) return []
        const newIds = checkAchievements(player, quests, logs, achievements, clearedDebuffCount)
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

      clearPendingLevelUp: () => set({ pendingLevelUp: null }),

      resetGame: () => {
        set({
          player: null,
          quests: [],
          logs: [],
          achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
          titles: DEFAULT_TITLES.map(t => ({ ...t })),
          partyMembers: [],
          pendingLevelUp: null,
          clearedDebuffCount: 0,
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
    }),
    {
      name: 'lifegame_store',
      storage: safeLocalStorage,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
