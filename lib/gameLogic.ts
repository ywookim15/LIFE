import { Tier, StatKey, Player, Achievement, Quest, DailyLog, StatConfig } from './types'
import { DEFAULT_STAT_CONFIG } from './defaultData'

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
    F: '#94a3b8', E: '#22c55e', D: '#3b82f6', C: '#a855f7',
    B: '#f97316', A: '#ef4444', S: '#fbbf24', 'S+': '#fde047', X: '#ffffff',
  }
  return map[tier]
}

export function getTierGlow(tier: Tier): string {
  if (tier === 'X') return '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.4)'
  if (tier === 'S+') return '0 0 20px rgba(253,224,71,0.8), 0 0 40px rgba(253,224,71,0.4)'
  if (tier === 'S') return '0 0 12px rgba(251,191,36,0.6)'
  return 'none'
}

// Default colors for the 5 original stats (used as fallback)
const DEFAULT_COLORS: Record<string, string> = {
  INT: '#a855f7', PHY: '#ef4444', WLT: '#fbbf24', CHA: '#ec4899', CRF: '#22c55e',
}

export function getStatColor(stat: StatKey, config?: StatConfig[]): string {
  const cfg = (config ?? DEFAULT_STAT_CONFIG).find(c => c.key === stat)
  return cfg?.color ?? DEFAULT_COLORS[stat] ?? '#64748b'
}

export function getStatLabel(stat: StatKey, config?: StatConfig[]): string {
  const cfg = (config ?? DEFAULT_STAT_CONFIG).find(c => c.key === stat)
  if (cfg) return cfg.label
  const defaults: Record<string, string> = {
    INT: 'Intelligence', PHY: 'Physical Prowess', WLT: 'Wealth', CHA: 'Charisma', CRF: 'Craft',
  }
  return defaults[stat] ?? stat
}

export function getStatDescription(stat: StatKey, config?: StatConfig[]): string {
  const cfg = (config ?? DEFAULT_STAT_CONFIG).find(c => c.key === stat)
  if (cfg) return cfg.description
  const defaults: Record<string, string> = {
    INT: 'Academics, research, mathematics, quant finance, and deep study.',
    PHY: 'Gym, running, combat training, athletics, and physical conditioning.',
    WLT: 'Trading, investing, income building, money management, and financial markets.',
    CHA: 'Speaking, vocabulary, communication, posture, presence, and social confidence.',
    CRF: 'Coding, building software, writing, and creating things.',
  }
  return defaults[stat] ?? ''
}

export const ALL_STAT_KEYS: StatKey[] = ['INT', 'PHY', 'WLT', 'CHA', 'CRF']

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

export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 1.5
  if (streak >= 14) return 1.3
  if (streak >= 7) return 1.2
  if (streak >= 3) return 1.1
  return 1.0
}

export function getQuestTypeXPMultiplier(type: Quest['type']): number {
  const map: Record<Quest['type'], number> = {
    habit: 1.0, today: 1.0, weekly: 1.2, yearly: 1.5, lifePurpose: 2.0,
  }
  return map[type] ?? 1.0
}

export function checkAchievements(
  player: Player,
  quests: Quest[],
  logs: DailyLog[],
  achievements: Achievement[],
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
      case 'substat_value': {
        const all = Object.values(player.stats).flatMap(b => b.subStats)
        unlocked = all.some(ss => ss.value >= condition.value)
        break
      }
      case 'substat_count_above': {
        const all = Object.values(player.stats).flatMap(b => b.subStats)
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
