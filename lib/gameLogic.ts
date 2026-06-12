import { Tier, StatKey, Player, Achievement, Title, Quest, DailyLog } from './types'

export const TIER_ORDER: Tier[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'S+', 'X']

const TIER_MULTIPLIERS: Record<Tier, number> = {
  F: 0, E: 1, D: 2, C: 3, B: 4, A: 5, S: 6, 'S+': 8, X: 10,
}

export function calcXPToNext(level: number, tier: Tier): number {
  return 100 + level * 50 + TIER_MULTIPLIERS[tier] * 200
}

export function getNextTier(tier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(tier)
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return null
  return TIER_ORDER[idx + 1]
}

export function getTierIndex(tier: Tier): number {
  return TIER_ORDER.indexOf(tier)
}

export function getTierColor(tier: Tier): string {
  const map: Record<Tier, string> = {
    F: '#94a3b8',
    E: '#22c55e',
    D: '#3b82f6',
    C: '#a855f7',
    B: '#f97316',
    A: '#ef4444',
    S: '#fbbf24',
    'S+': '#fde047',
    X: '#ffffff',
  }
  return map[tier]
}

export function getTierGlow(tier: Tier): string {
  if (tier === 'X') return '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.4)'
  if (tier === 'S+') return '0 0 20px rgba(253,224,71,0.8), 0 0 40px rgba(253,224,71,0.4)'
  if (tier === 'S') return '0 0 12px rgba(251,191,36,0.6)'
  return 'none'
}

export function getStatColor(stat: StatKey): string {
  const map: Record<StatKey, string> = {
    INT: '#a855f7',
    STR: '#ef4444',
    AGI: '#22c55e',
    END: '#f97316',
    WIS: '#3b82f6',
    CHA: '#ec4899',
  }
  return map[stat]
}

export function getStatLabel(stat: StatKey): string {
  const map: Record<StatKey, string> = {
    INT: 'Intelligence',
    STR: 'Strength',
    AGI: 'Agility',
    END: 'Endurance',
    WIS: 'Wisdom',
    CHA: 'Charisma',
  }
  return map[stat]
}

export const ALL_STAT_KEYS: StatKey[] = ['INT', 'STR', 'AGI', 'END', 'WIS', 'CHA']

export function getDaysActive(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)))
}

export function checkDailyStreak(logs: DailyLog[]): number {
  let streak = 0
  const today = new Date()
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const log = logs.find(l => l.date === dateStr && l.aiEvaluation)
    if (!log) break
    streak++
  }
  return streak
}

export function checkAchievements(
  player: Player,
  quests: Quest[],
  logs: DailyLog[],
  achievements: Achievement[],
  clearedDebuffCount: number
): string[] {
  const newlyUnlocked: string[] = []
  for (const ach of achievements) {
    if (ach.unlockedAt) continue
    const { condition } = ach
    let unlocked = false
    switch (condition.type) {
      case 'quest_count':
        unlocked = quests.filter(q => q.status === 'completed').length >= condition.count
        break
      case 'tier_reached':
        unlocked = getTierIndex(player.tier) >= getTierIndex(condition.tier)
        break
      case 'daily_streak':
        unlocked = checkDailyStreak(logs) >= condition.days
        break
      case 'debuff_cleared':
        unlocked = clearedDebuffCount >= condition.count
        break
      case 'substat_value': {
        const all = ALL_STAT_KEYS.flatMap(k => player.stats[k].subStats)
        unlocked = all.some(ss => ss.value >= condition.value)
        break
      }
      case 'substat_count_above': {
        const all = ALL_STAT_KEYS.flatMap(k => player.stats[k].subStats)
        unlocked = all.filter(ss => ss.value >= condition.threshold).length >= condition.count
        break
      }
      case 'level_reached':
        unlocked = player.level >= condition.level
        break
      case 'daily_xp': {
        const max = Math.max(0, ...logs.filter(l => l.aiEvaluation).map(l => l.aiEvaluation!.xpAwarded))
        unlocked = max >= condition.xp
        break
      }
    }
    if (unlocked) newlyUnlocked.push(ach.id)
  }
  return newlyUnlocked
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}
