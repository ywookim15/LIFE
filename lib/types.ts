export type StatKey = string
export type Tier = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+' | 'X'

export interface StatConfig {
  key: string
  label: string
  description: string
  color: string
}

export interface SubStat {
  id: string
  name: string
  description: string
  value: number
  parentStat: StatKey
}

export interface StatBlock {
  value: number
  subStats: SubStat[]
}

export interface StatSnapshot {
  date: string
  stats: Record<StatKey, number>
  totalXP: number
  level: number
  tier: Tier
}

export interface Player {
  id: string
  name: string
  title: string
  customTitle?: string
  tier: Tier
  level: number
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
  shortTitle?: string   // max 15 chars, shown on calendar
  description: string
  type: 'habit' | 'today' | 'weekly' | 'yearly' | 'lifePurpose'
  status: 'active' | 'completed' | 'failed'
  linkedStat: StatKey       // primary stat (first selected), used for display color
  linkedStats?: StatKey[]   // all selected stats; XP is split evenly between them
  linkedSubStats: string[]
  createdAt: string
  dueDate?: string
  dueTime?: string      // HH:MM
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
  date: string
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
  | { type: 'total_xp'; xp: number }
  | { type: 'quest_type_count'; questType: Quest['type']; count: number }
  | { type: 'habit_streak'; days: number }
  | { type: 'workout_count'; count: number }
  | { type: 'workout_type_count'; exerciseType: ExerciseType; count: number }
  | { type: 'manual_pr_count'; count: number }
  | { type: 'party_count'; count: number }
  | { type: 'log_count'; count: number }
  | { type: 'lp_milestone_count'; count: number }

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

export interface CalendarEvent {
  id: string
  title: string
  shortTitle?: string   // max 15 chars, shown on calendar cells
  date: string          // YYYY-MM-DD (start date)
  endDate?: string      // YYYY-MM-DD (for multi-day events)
  startTime?: string    // HH:MM (optional)
  endTime?: string      // HH:MM (optional)
  description?: string
  color?: string
}

export interface ManualPR {
  id: string
  exerciseName: string
  weight: number
  reps: number
  notes?: string
  date: string // YYYY-MM-DD
}

// ─── Workout / Body System ─────────────────────────────────────────────────

export type ExerciseType = 'gym' | 'calisthenics' | 'cardio'

export type MuscleGroup =
  | 'chest' | 'back' | 'triceps' | 'biceps' | 'forearms'
  | 'abs' | 'calves' | 'quads' | 'hamstrings' | 'shoulders'

export const ALL_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'abs', 'quads', 'hamstrings', 'calves',
]

export interface LoggedSet {
  reps: number
  weight: number
  distance?: number   // meters (cardio)
  duration?: number   // seconds (cardio)
}

export interface LoggedExercise {
  name: string
  muscleGroups: MuscleGroup[]
  exerciseType?: ExerciseType
  sets: LoggedSet[]
}

export interface WorkoutLog {
  id: string
  date: string
  planId?: string
  planName?: string
  exercises: LoggedExercise[]
  notes?: string
}

export interface PlanExercise {
  id: string
  name: string
  muscleGroups: MuscleGroup[]
  exerciseType?: ExerciseType
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
