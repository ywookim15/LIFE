export type Tier = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+' | 'X'
export type StatKey = 'INT' | 'PHY' | 'WLT' | 'CHA' | 'CRF'

export interface SubStat {
  id: string
  name: string
  description: string
  value: number // 1-100
  parentStat: StatKey
}

export interface StatBlock {
  value: number // 1-999
  subStats: SubStat[]
}

export interface StatSnapshot {
  date: string // YYYY-MM-DD
  stats: Record<StatKey, number>
  totalXP: number
  level: number
  tier: Tier
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
  createdAt: string
  statHistory?: StatSnapshot[]
}

export interface Quest {
  id: string
  title: string
  description: string
  type: 'habit' | 'today' | 'weekly' | 'yearly' | 'lifePurpose'
  status: 'active' | 'completed' | 'failed'
  linkedStat: StatKey
  linkedSubStats: string[]
  createdAt: string
  dueDate?: string
  completedAt?: string
  milestones?: Milestone[]
  xpAwarded?: number
  isRecurring?: boolean
  lastResetDate?: string
  streak?: number
  completionLog?: { date: string; status: 'completed' | 'failed' }[]
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
  statBreakdown: { stat: StatKey; xp: number; reasoning: string }[]
  subStatUpdates?: { id: string; increase: number }[]
  systemMessage: string
  evaluatedAt: string
}

export type AchievementCondition =
  | { type: 'quest_count'; count: number }
  | { type: 'tier_reached'; tier: Tier }
  | { type: 'daily_streak'; days: number }
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

// ─── Workout / Body System ─────────────────────────────────────────────────

export type MuscleGroup =
  | 'chest' | 'back' | 'triceps' | 'biceps' | 'forearms'
  | 'abs' | 'calves' | 'quads' | 'hamstrings' | 'shoulders'

export const ALL_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'abs', 'quads', 'hamstrings', 'calves',
]

export interface LoggedSet {
  reps: number
  weight: number // lbs
}

export interface LoggedExercise {
  name: string
  muscleGroups: MuscleGroup[]
  sets: LoggedSet[]
}

export interface WorkoutLog {
  id: string
  date: string // YYYY-MM-DD
  planId?: string
  planName?: string
  exercises: LoggedExercise[]
  notes?: string
}

export interface PlanExercise {
  id: string
  name: string
  muscleGroups: MuscleGroup[]
  sets: number
  reps: number
  weight?: number
}

export interface WorkoutPlan {
  id: string
  name: string
  exercises: PlanExercise[]
  createdAt: string
}
