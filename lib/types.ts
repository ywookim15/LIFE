export type Tier = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+' | 'X'
export type StatKey = 'INT' | 'STR' | 'AGI' | 'END' | 'WIS' | 'CHA'

export interface SubStat {
  id: string
  name: string
  value: number // 1-100
  parentStat: StatKey
}

export interface StatBlock {
  value: number // 1-999
  subStats: SubStat[]
}

export interface Player {
  id: string
  name: string
  title: string
  tier: Tier
  level: number // 1-100 within tier
  xp: number
  xpToNext: number
  totalXP: number
  stats: Record<StatKey, StatBlock>
  activeDebuffs: Debuff[]
  createdAt: string
}

export interface Quest {
  id: string
  title: string
  description: string
  type: 'daily' | 'side' | 'main'
  status: 'active' | 'completed' | 'failed'
  linkedStat: StatKey
  linkedSubStats: string[]
  createdAt: string
  dueDate?: string
  completedAt?: string
  milestones?: Milestone[]
  xpAwarded?: number
}

export interface Milestone {
  id: string
  title: string
  completed: boolean
}

export interface DailyLog {
  id: string
  date: string // YYYY-MM-DD
  content: string
  questsCompleted: string[]
  aiEvaluation?: AIEvaluation
}

export interface AIEvaluation {
  xpAwarded: number
  statBreakdown: { stat: StatKey; xp: number }[]
  subStatUpdates?: { id: string; increase: number }[]
  systemMessage: string
  debuffsApplied: Debuff[]
  debuffsLifted: string[]
  evaluatedAt: string
}

export interface Debuff {
  id: string
  name: string
  description: string
  affectedStat: StatKey
  penalty: number
  appliedAt: string
  clearedAt?: string
  clearCondition: string
}

export type AchievementCondition =
  | { type: 'quest_count'; count: number }
  | { type: 'tier_reached'; tier: Tier }
  | { type: 'daily_streak'; days: number }
  | { type: 'debuff_cleared'; count: number }
  | { type: 'substat_value'; value: number }
  | { type: 'substat_count_above'; count: number; threshold: number }
  | { type: 'level_reached'; level: number }
  | { type: 'daily_xp'; xp: number }

export interface Achievement {
  id: string
  title: string
  description: string
  condition: AchievementCondition
  unlockedAt?: string
}

export interface Title {
  id: string
  name: string
  description: string
  equipped: boolean
  achievementId: string
  unlockedAt?: string
}

export interface PartyMember {
  id: string
  name: string
  profile: Player
  quests: Quest[]
  achievements: Achievement[]
  titles: Title[]
  lastUpdated: string
}

export interface LevelUpData {
  previousLevel: number
  newLevel: number
  previousTier: Tier
  newTier: Tier
  tieredUp: boolean
}
