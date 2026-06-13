import { Achievement, Title, Player, StatBlock } from './types'
import { calcXPToNext, generateId } from './gameLogic'

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Complete your first quest.',
    condition: { type: 'quest_count', count: 1 },
  },
  {
    id: 'awakened',
    title: 'Awakened',
    description: 'Reach tier E.',
    condition: { type: 'tier_reached', tier: 'E' },
  },
  {
    id: 'the_grind',
    title: 'The Grind',
    description: 'Complete 7 daily quests in a row.',
    condition: { type: 'daily_streak', days: 7 },
  },
  {
    id: 'specialist',
    title: 'Specialist',
    description: 'Reach 50 in any sub-stat.',
    condition: { type: 'substat_value', value: 50 },
  },
  {
    id: 'polymath',
    title: 'Polymath',
    description: 'Have at least 3 sub-stats above 30.',
    condition: { type: 'substat_count_above', count: 3, threshold: 30 },
  },
  {
    id: 'century',
    title: 'Century',
    description: 'Reach level 100 in any tier.',
    condition: { type: 'level_reached', level: 100 },
  },
  {
    id: 'transcendent',
    title: 'Transcendent',
    description: 'Reach tier S.',
    condition: { type: 'tier_reached', tier: 'S' },
  },
  {
    id: 'unbounded',
    title: 'Unbounded',
    description: 'Reach tier X.',
    condition: { type: 'tier_reached', tier: 'X' },
  },
  {
    id: 'consistent',
    title: 'Consistent',
    description: '30-day streak of daily log submissions.',
    condition: { type: 'daily_streak', days: 30 },
  },
  {
    id: 'overachiever',
    title: 'Overachiever',
    description: 'Earn 500 XP in a single day evaluation.',
    condition: { type: 'daily_xp', xp: 500 },
  },
]

export const DEFAULT_TITLES: Title[] = [
  {
    id: 'title_awakened',
    name: 'The Awakened',
    description: 'One who has crossed the threshold.',
    equipped: false,
    achievementId: 'awakened',
  },
  {
    id: 'title_code_monk',
    name: 'Code Monk',
    description: 'One who has mastered a discipline.',
    equipped: false,
    achievementId: 'specialist',
  },
  {
    id: 'title_unstoppable',
    name: 'Unstoppable',
    description: 'Thirty days. No exceptions.',
    equipped: false,
    achievementId: 'consistent',
  },
  {
    id: 'title_transcendent',
    name: 'Transcendent',
    description: 'Beyond the limits of ordinary.',
    equipped: false,
    achievementId: 'transcendent',
  },
  {
    id: 'title_unbounded',
    name: 'Unbounded',
    description: 'The system cannot contain you.',
    equipped: false,
    achievementId: 'unbounded',
  },
  {
    id: 'title_grinder',
    name: 'The Grinder',
    description: 'Seven days of relentless effort.',
    equipped: false,
    achievementId: 'the_grind',
  },
  {
    id: 'title_overachiever',
    name: 'Overachiever',
    description: 'Performance beyond expectation.',
    equipped: false,
    achievementId: 'overachiever',
  },
]

export function createInitialPlayer(name: string): Player {
  const emptyStatBlock = (): StatBlock => ({ value: 1, subStats: [] })
  return {
    id: generateId(),
    name,
    title: '',
    tier: 'F',
    level: 1,
    xp: 0,
    xpToNext: calcXPToNext(1, 'F'),
    totalXP: 0,
    stats: {
      INT: emptyStatBlock(),
      PHY: emptyStatBlock(),
      WLT: emptyStatBlock(),
      CHA: emptyStatBlock(),
      CRF: emptyStatBlock(),
    },
    createdAt: new Date().toISOString(),
    statHistory: [],
  }
}
