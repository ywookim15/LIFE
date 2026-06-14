import { Achievement, Title, Player, StatBlock, StatConfig } from './types'
import { generateId } from './gameLogic'

export const DEFAULT_STAT_CONFIG: StatConfig[] = [
  { key: 'INT', label: 'Intelligence', description: 'Academics, research, mathematics, quant finance, and deep study. The mind is a weapon.', color: '#a855f7' },
  { key: 'PHY', label: 'Physical Prowess', description: 'Gym, running, combat training, athletics, and physical conditioning. The body is the foundation.', color: '#ef4444' },
  { key: 'WLT', label: 'Wealth', description: 'Trading, investing, income building, money management, and financial markets. Capital is power.', color: '#fbbf24' },
  { key: 'CHA', label: 'Charisma', description: 'Speaking, vocabulary, communication, posture, presence, and social confidence. Influence is earned.', color: '#ec4899' },
  { key: 'CRF', label: 'Craft', description: 'Coding, building software, writing, and creating things. Makers shape the world.', color: '#22c55e' },
]

export const STAT_PALETTE = [
  '#a855f7', '#ef4444', '#fbbf24', '#ec4899', '#22c55e',
  '#3b82f6', '#f97316', '#06b6d4', '#84cc16', '#e879f9',
  '#f43f5e', '#8b5cf6', '#14b8a6', '#eab308', '#6366f1',
]

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // ── Core 9 (kept) ──────────────────────────────────────────────────
  { id: 'first_blood',      title: 'First Blood',      description: 'Complete your first quest.',                                 condition: { type: 'quest_count', count: 1 } },
  { id: 'awakened',         title: 'Awakened',         description: 'Reach tier E.',                                              condition: { type: 'tier_reached', tier: 'E' } },
  { id: 'the_grind',        title: 'The Grind',        description: 'Submit daily logs 7 days in a row.',                        condition: { type: 'daily_streak', days: 7 } },
  { id: 'specialist',       title: 'Specialist',       description: 'Reach 50 in any sub-stat.',                                 condition: { type: 'substat_value', value: 50 } },
  { id: 'polymath',         title: 'Polymath',         description: 'Have at least 3 sub-stats above 30.',                       condition: { type: 'substat_count_above', count: 3, threshold: 30 } },
  { id: 'transcendent',     title: 'Transcendent',     description: 'Reach tier S.',                                             condition: { type: 'tier_reached', tier: 'S' } },
  { id: 'unbounded',        title: 'Unbounded',        description: 'Reach tier X. You may now define your own title.',          condition: { type: 'tier_reached', tier: 'X' } },
  { id: 'consistent',       title: 'Consistent',       description: '30-day streak of daily log submissions.',                   condition: { type: 'daily_streak', days: 30 } },
  { id: 'overachiever',     title: 'Overachiever',     description: 'Earn 500 XP in a single day evaluation.',                  condition: { type: 'daily_xp', xp: 500 } },

  // ── Tier Progression ───────────────────────────────────────────────
  { id: 'ascending',        title: 'Ascending',        description: 'Reach tier D.',                                             condition: { type: 'tier_reached', tier: 'D' } },
  { id: 'middle_path',      title: 'Middle Path',      description: 'Reach tier C.',                                             condition: { type: 'tier_reached', tier: 'C' } },
  { id: 'breaking_through', title: 'Breaking Through', description: 'Reach tier B.',                                             condition: { type: 'tier_reached', tier: 'B' } },
  { id: 'elite_tier',       title: 'Elite',            description: 'Reach tier A.',                                             condition: { type: 'tier_reached', tier: 'A' } },
  { id: 'apex',             title: 'The Apex',         description: 'Reach tier S+.',                                            condition: { type: 'tier_reached', tier: 'S+' } },

  // ── Specialist Progression ─────────────────────────────────────────
  { id: 'first_skill',      title: 'First Skill',      description: 'Reach 10 in any sub-stat.',                                 condition: { type: 'substat_value', value: 10 } },
  { id: 'skilled',          title: 'Skilled',          description: 'Reach 25 in any sub-stat.',                                 condition: { type: 'substat_value', value: 25 } },
  { id: 'expert',           title: 'Expert',           description: 'Reach 100 in any sub-stat.',                                condition: { type: 'substat_value', value: 100 } },
  { id: 'master',           title: 'Master',           description: 'Reach 500 in any sub-stat.',                                condition: { type: 'substat_value', value: 500 } },
  { id: 'grandmaster',      title: 'Grandmaster',      description: 'Reach 1000 in any sub-stat.',                               condition: { type: 'substat_value', value: 1000 } },
  { id: 'sub_legend',       title: 'Sub Legend',       description: 'Reach 2500 in any sub-stat.',                               condition: { type: 'substat_value', value: 2500 } },

  // ── Polymath Expansion ─────────────────────────────────────────────
  { id: 'jack_of_all',      title: 'Jack of All',      description: 'Have 5 sub-stats above 20.',                                condition: { type: 'substat_count_above', count: 5, threshold: 20 } },
  { id: 'renaissance',      title: 'Renaissance',      description: 'Have 3 sub-stats above 50.',                                condition: { type: 'substat_count_above', count: 3, threshold: 50 } },
  { id: 'well_rounded',     title: 'Well Rounded',     description: 'Have 8 sub-stats above 30.',                                condition: { type: 'substat_count_above', count: 8, threshold: 30 } },
  { id: 'omnimastery',      title: 'Omnimastery',      description: 'Have 3 sub-stats above 100.',                               condition: { type: 'substat_count_above', count: 3, threshold: 100 } },
  { id: 'apex_mind',        title: 'Apex Mind',        description: 'Have 5 sub-stats above 100.',                               condition: { type: 'substat_count_above', count: 5, threshold: 100 } },

  // ── Daily Streak Progression ───────────────────────────────────────
  { id: 'fortnight',        title: 'Fortnight',        description: '14-day streak of daily log submissions.',                   condition: { type: 'daily_streak', days: 14 } },
  { id: 'two_months',       title: 'Two Months',       description: '60-day streak of daily log submissions.',                   condition: { type: 'daily_streak', days: 60 } },
  { id: 'quarter_year',     title: 'Quarter Year',     description: '90-day streak of daily log submissions.',                   condition: { type: 'daily_streak', days: 90 } },
  { id: 'half_year',        title: 'Six Months',       description: '180-day streak of daily log submissions.',                  condition: { type: 'daily_streak', days: 180 } },
  { id: 'year_long',        title: 'Year Long',        description: '365-day streak of daily log submissions.',                  condition: { type: 'daily_streak', days: 365 } },

  // ── Total Quest Count ──────────────────────────────────────────────
  { id: 'motivated',        title: 'Motivated',        description: 'Complete 10 quests.',                                       condition: { type: 'quest_count', count: 10 } },
  { id: 'on_a_roll',        title: 'On a Roll',        description: 'Complete 25 quests.',                                       condition: { type: 'quest_count', count: 25 } },
  { id: 'dedicated',        title: 'Dedicated',        description: 'Complete 50 quests.',                                       condition: { type: 'quest_count', count: 50 } },
  { id: 'veteran',          title: 'Veteran',          description: 'Complete 100 quests.',                                      condition: { type: 'quest_count', count: 100 } },
  { id: 'quest_legend',     title: 'Quest Legend',     description: 'Complete 250 quests.',                                      condition: { type: 'quest_count', count: 250 } },
  { id: 'myth',             title: 'The Myth',         description: 'Complete 500 quests.',                                      condition: { type: 'quest_count', count: 500 } },
  { id: 'the_eternal',      title: 'The Eternal',      description: 'Complete 1000 quests.',                                     condition: { type: 'quest_count', count: 1000 } },

  // ── Habit Completions ──────────────────────────────────────────────
  { id: 'habit_born',       title: 'Habit Born',       description: 'Complete a habit 10 times total.',                          condition: { type: 'quest_type_count', questType: 'habit', count: 10 } },
  { id: 'habit_spark',      title: 'Habit Spark',      description: 'Complete a habit 50 times total.',                          condition: { type: 'quest_type_count', questType: 'habit', count: 50 } },
  { id: 'ritual_master',    title: 'Ritual Master',    description: 'Complete habits 100 times total.',                          condition: { type: 'quest_type_count', questType: 'habit', count: 100 } },
  { id: 'daily_devotion',   title: 'Daily Devotion',   description: 'Complete habits 365 times total.',                          condition: { type: 'quest_type_count', questType: 'habit', count: 365 } },
  { id: 'eternal_ritual',   title: 'Eternal Ritual',   description: 'Complete habits 1000 times total.',                         condition: { type: 'quest_type_count', questType: 'habit', count: 1000 } },

  // ── Habit Streaks ──────────────────────────────────────────────────
  { id: 'habit_week',       title: 'Habit Week',       description: 'Maintain any single habit for a 7-day streak.',             condition: { type: 'habit_streak', days: 7 } },
  { id: 'habit_month',      title: 'Iron Habit',       description: 'Maintain any single habit for a 30-day streak.',            condition: { type: 'habit_streak', days: 30 } },
  { id: 'habit_century',    title: 'Unbreakable',      description: 'Maintain any single habit for a 100-day streak.',           condition: { type: 'habit_streak', days: 100 } },
  { id: 'habit_year',       title: 'Eternal Habit',    description: 'Maintain any single habit for a 365-day streak.',           condition: { type: 'habit_streak', days: 365 } },

  // ── Today's Quests ─────────────────────────────────────────────────
  { id: 'today_starter',    title: 'Today Starter',    description: 'Complete 10 daily quests.',                                 condition: { type: 'quest_type_count', questType: 'today', count: 10 } },
  { id: 'today_regular',    title: 'Today Regular',    description: 'Complete 25 daily quests.',                                 condition: { type: 'quest_type_count', questType: 'today', count: 25 } },
  { id: 'today_veteran',    title: 'Today Veteran',    description: 'Complete 100 daily quests.',                                condition: { type: 'quest_type_count', questType: 'today', count: 100 } },
  { id: 'today_legend',     title: 'Today Legend',     description: 'Complete 250 daily quests.',                                condition: { type: 'quest_type_count', questType: 'today', count: 250 } },

  // ── Weekly Quests ──────────────────────────────────────────────────
  { id: 'weekly_warrior',   title: 'Weekly Warrior',   description: 'Complete 10 weekly quests.',                                condition: { type: 'quest_type_count', questType: 'weekly', count: 10 } },
  { id: 'weekly_veteran',   title: 'Weekly Veteran',   description: 'Complete 25 weekly quests.',                                condition: { type: 'quest_type_count', questType: 'weekly', count: 25 } },
  { id: 'weekly_legend',    title: 'Weekly Legend',    description: 'Complete 50 weekly quests.',                                condition: { type: 'quest_type_count', questType: 'weekly', count: 50 } },

  // ── Yearly Quests ──────────────────────────────────────────────────
  { id: 'yearly_starter',   title: 'Yearly Starter',   description: 'Complete your first yearly quest.',                         condition: { type: 'quest_type_count', questType: 'yearly', count: 1 } },
  { id: 'long_player',      title: 'Long Player',      description: 'Complete 5 yearly quests.',                                 condition: { type: 'quest_type_count', questType: 'yearly', count: 5 } },
  { id: 'yearly_veteran',   title: 'Yearly Veteran',   description: 'Complete 15 yearly quests.',                                condition: { type: 'quest_type_count', questType: 'yearly', count: 15 } },
  { id: 'yearly_legend',    title: 'Yearly Legend',    description: 'Complete 30 yearly quests.',                                condition: { type: 'quest_type_count', questType: 'yearly', count: 30 } },

  // ── Life Purpose ───────────────────────────────────────────────────
  { id: 'dream_seeker',     title: 'Dream Seeker',     description: 'Complete your first life purpose milestone.',                condition: { type: 'lp_milestone_count', count: 1 } },
  { id: 'life_mission',     title: "Life's Mission",   description: 'Complete 10 life purpose milestones.',                      condition: { type: 'lp_milestone_count', count: 10 } },
  { id: 'purpose_legend',   title: 'The Fulfilled',    description: 'Complete 25 life purpose milestones.',                      condition: { type: 'lp_milestone_count', count: 25 } },

  // ── Total XP ───────────────────────────────────────────────────────
  { id: 'thousand_xp',      title: '1K Club',          description: 'Accumulate 1,000 total XP.',                                condition: { type: 'total_xp', xp: 1000 } },
  { id: 'five_k_xp',        title: '5K Club',          description: 'Accumulate 5,000 total XP.',                                condition: { type: 'total_xp', xp: 5000 } },
  { id: 'twenty_five_k',    title: '25K Club',         description: 'Accumulate 25,000 total XP.',                               condition: { type: 'total_xp', xp: 25000 } },
  { id: 'hundred_k',        title: '100K Club',        description: 'Accumulate 100,000 total XP.',                              condition: { type: 'total_xp', xp: 100000 } },
  { id: 'half_mil',         title: 'Half Million',     description: 'Accumulate 500,000 total XP.',                              condition: { type: 'total_xp', xp: 500000 } },
  { id: 'million_xp',       title: 'XP God',           description: 'Accumulate 1,000,000 total XP.',                            condition: { type: 'total_xp', xp: 1000000 } },

  // ── Workout Volume ─────────────────────────────────────────────────
  { id: 'first_rep',        title: 'First Rep',        description: 'Log your first workout.',                                   condition: { type: 'workout_count', count: 1 } },
  { id: 'iron_will',        title: 'Iron Will',        description: 'Log 10 workout sessions.',                                  condition: { type: 'workout_count', count: 10 } },
  { id: 'beast_mode',       title: 'Beast Mode',       description: 'Log 25 workout sessions.',                                  condition: { type: 'workout_count', count: 25 } },
  { id: 'iron_body',        title: 'Iron Body',        description: 'Log 50 workout sessions.',                                  condition: { type: 'workout_count', count: 50 } },
  { id: 'century_workouts', title: '100 Sessions',     description: 'Log 100 workout sessions.',                                 condition: { type: 'workout_count', count: 100 } },
  { id: 'two_fifty_wk',     title: '250 Sessions',     description: 'Log 250 workout sessions.',                                 condition: { type: 'workout_count', count: 250 } },
  { id: 'workout_legend',   title: 'Workout Legend',   description: 'Log 500 workout sessions.',                                 condition: { type: 'workout_count', count: 500 } },

  // ── Cardio ─────────────────────────────────────────────────────────
  { id: 'cardio_start',     title: 'Cardio Start',     description: 'Log your first cardio session.',                            condition: { type: 'workout_type_count', exerciseType: 'cardio', count: 1 } },
  { id: 'cardio_regular',   title: 'Cardio Regular',   description: 'Log 10 cardio sessions.',                                   condition: { type: 'workout_type_count', exerciseType: 'cardio', count: 10 } },
  { id: 'cardio_king',      title: 'Cardio King',      description: 'Log 25 cardio sessions.',                                   condition: { type: 'workout_type_count', exerciseType: 'cardio', count: 25 } },
  { id: 'cardio_veteran',   title: 'Cardio Veteran',   description: 'Log 50 cardio sessions.',                                   condition: { type: 'workout_type_count', exerciseType: 'cardio', count: 50 } },
  { id: 'cardio_legend',    title: 'Endurance God',    description: 'Log 100 cardio sessions.',                                  condition: { type: 'workout_type_count', exerciseType: 'cardio', count: 100 } },

  // ── Calisthenics ───────────────────────────────────────────────────
  { id: 'cali_start',       title: 'Cali Start',       description: 'Log your first calisthenics session.',                      condition: { type: 'workout_type_count', exerciseType: 'calisthenics', count: 1 } },
  { id: 'cali_regular',     title: 'Cali Regular',     description: 'Log 10 calisthenics sessions.',                             condition: { type: 'workout_type_count', exerciseType: 'calisthenics', count: 10 } },
  { id: 'cali_warrior',     title: 'Calisthenics Warrior', description: 'Log 25 calisthenics sessions.',                         condition: { type: 'workout_type_count', exerciseType: 'calisthenics', count: 25 } },
  { id: 'cali_veteran',     title: 'Cali Veteran',     description: 'Log 50 calisthenics sessions.',                             condition: { type: 'workout_type_count', exerciseType: 'calisthenics', count: 50 } },

  // ── Gym ────────────────────────────────────────────────────────────
  { id: 'gym_start',        title: 'Gym Start',        description: 'Log your first gym session.',                               condition: { type: 'workout_type_count', exerciseType: 'gym', count: 1 } },
  { id: 'gym_regular',      title: 'Gym Regular',      description: 'Log 10 gym sessions.',                                      condition: { type: 'workout_type_count', exerciseType: 'gym', count: 10 } },
  { id: 'iron_monk',        title: 'Iron Monk',        description: 'Log 50 gym sessions.',                                      condition: { type: 'workout_type_count', exerciseType: 'gym', count: 50 } },
  { id: 'gym_legend',       title: 'Gym Legend',       description: 'Log 100 gym sessions.',                                     condition: { type: 'workout_type_count', exerciseType: 'gym', count: 100 } },
  { id: 'gym_master',       title: 'Gym Master',       description: 'Log 250 gym sessions.',                                     condition: { type: 'workout_type_count', exerciseType: 'gym', count: 250 } },

  // ── Manual PRs ─────────────────────────────────────────────────────
  { id: 'pr_hunter',        title: 'PR Hunter',        description: 'Log your first personal record.',                           condition: { type: 'manual_pr_count', count: 1 } },
  { id: 'record_chaser',    title: 'Record Chaser',    description: 'Log 5 personal records.',                                   condition: { type: 'manual_pr_count', count: 5 } },
  { id: 'pr_legend',        title: 'PR Legend',        description: 'Log 20 personal records.',                                  condition: { type: 'manual_pr_count', count: 20 } },

  // ── Daily XP Peaks ─────────────────────────────────────────────────
  { id: 'good_day',         title: 'Good Day',         description: 'Earn 200 XP in a single day evaluation.',                  condition: { type: 'daily_xp', xp: 200 } },
  { id: 'legendary_day',    title: 'Legendary',        description: 'Earn 700 XP in a single day evaluation.',                  condition: { type: 'daily_xp', xp: 700 } },

  // ── Log Count ──────────────────────────────────────────────────────
  { id: 'first_entry',      title: 'First Entry',      description: 'Submit your first evaluated daily log.',                    condition: { type: 'log_count', count: 1 } },
  { id: 'regular_scholar',  title: 'Regular Scholar',  description: 'Submit 10 evaluated daily logs.',                          condition: { type: 'log_count', count: 10 } },
  { id: 'dedicated_scholar',title: 'Dedicated Scholar','description': 'Submit 50 evaluated daily logs.',                        condition: { type: 'log_count', count: 50 } },
  { id: 'chronicler',       title: 'The Chronicler',   description: 'Submit 100 evaluated daily logs.',                         condition: { type: 'log_count', count: 100 } },
  { id: 'year_scholar',     title: 'Year Scholar',     description: 'Submit 365 evaluated daily logs.',                         condition: { type: 'log_count', count: 365 } },

  // ── Party ──────────────────────────────────────────────────────────
  { id: 'first_ally',       title: 'First Ally',       description: 'Add your first party member.',                              condition: { type: 'party_count', count: 1 } },
  { id: 'squad',            title: 'The Squad',        description: 'Have 3 party members.',                                    condition: { type: 'party_count', count: 3 } },
  { id: 'legion',           title: 'The Legion',       description: 'Have 5 party members.',                                    condition: { type: 'party_count', count: 5 } },
]

export const DEFAULT_TITLES: Title[] = [
  // Original titles
  { id: 'title_awakened',       name: 'The Awakened',         description: 'One who has crossed the threshold.',                    equipped: false, achievementId: 'awakened' },
  { id: 'title_code_monk',      name: 'Code Monk',            description: 'One who has mastered a discipline.',                    equipped: false, achievementId: 'specialist' },
  { id: 'title_unstoppable',    name: 'Unstoppable',          description: 'Thirty days. No exceptions.',                           equipped: false, achievementId: 'consistent' },
  { id: 'title_transcendent',   name: 'Transcendent',         description: 'Beyond the limits of ordinary.',                        equipped: false, achievementId: 'transcendent' },
  { id: 'title_unbounded',      name: 'Unbounded',            description: 'The system cannot contain you. Define your own legend.', equipped: false, achievementId: 'unbounded' },
  { id: 'title_grinder',        name: 'The Grinder',          description: 'Seven days of relentless effort.',                      equipped: false, achievementId: 'the_grind' },
  { id: 'title_overachiever',   name: 'Overachiever',         description: 'Performance beyond expectation.',                       equipped: false, achievementId: 'overachiever' },
  // Tier titles
  { id: 'title_ascending',      name: 'The Ascending',        description: 'Rising through the ranks.',                             equipped: false, achievementId: 'ascending' },
  { id: 'title_determined',     name: 'The Determined',       description: 'Halfway up the mountain.',                              equipped: false, achievementId: 'middle_path' },
  { id: 'title_breaker',        name: 'The Breaker',          description: 'One who breaks through limits.',                        equipped: false, achievementId: 'breaking_through' },
  { id: 'title_elite',          name: 'The Elite',            description: 'Among the top tier of performers.',                     equipped: false, achievementId: 'elite_tier' },
  { id: 'title_apex',           name: 'The Apex',             description: 'One level below godhood.',                              equipped: false, achievementId: 'apex' },
  // Skill titles
  { id: 'title_grandmaster',    name: 'Grandmaster',          description: 'A thousand points of mastery.',                         equipped: false, achievementId: 'grandmaster' },
  { id: 'title_sub_legend',     name: 'Sub Legend',           description: 'A sub-stat beyond measure.',                            equipped: false, achievementId: 'sub_legend' },
  { id: 'title_omnimastery',    name: 'Omnimastery',          description: 'Master of many disciplines.',                           equipped: false, achievementId: 'omnimastery' },
  { id: 'title_apex_mind',      name: 'Apex Mind',            description: 'Five disciplines at 100+.',                             equipped: false, achievementId: 'apex_mind' },
  // Streak titles
  { id: 'title_relentless',     name: 'Relentless',           description: 'Sixty days without stopping.',                          equipped: false, achievementId: 'two_months' },
  { id: 'title_quarter_year',   name: 'Quarter Year',         description: 'Ninety days of discipline.',                            equipped: false, achievementId: 'quarter_year' },
  { id: 'title_six_months',     name: 'Six Months',           description: 'Half a year of unbroken effort.',                       equipped: false, achievementId: 'half_year' },
  { id: 'title_eternal_grind',  name: 'Eternal Grind',        description: 'A full year. Every single day.',                        equipped: false, achievementId: 'year_long' },
  // Quest count titles
  { id: 'title_veteran',        name: 'Veteran',              description: 'A hundred quests completed.',                           equipped: false, achievementId: 'veteran' },
  { id: 'title_legend',         name: 'Legend',               description: 'Two hundred and fifty quests done.',                    equipped: false, achievementId: 'quest_legend' },
  { id: 'title_myth',           name: 'The Myth',             description: 'Five hundred quests. They talk about you.',             equipped: false, achievementId: 'myth' },
  { id: 'title_eternal',        name: 'The Eternal',          description: 'A thousand quests. You never stop.',                    equipped: false, achievementId: 'the_eternal' },
  // Habit titles
  { id: 'title_daily_devotion', name: 'Daily Devotion',       description: 'Three hundred sixty-five habit completions.',           equipped: false, achievementId: 'daily_devotion' },
  { id: 'title_ritualist',      name: 'The Ritualist',        description: 'A thousand habit completions.',                         equipped: false, achievementId: 'eternal_ritual' },
  { id: 'title_iron_habit',     name: 'Iron Habit',           description: 'Thirty days on a single habit.',                        equipped: false, achievementId: 'habit_month' },
  { id: 'title_unbreakable',    name: 'Unbreakable',          description: 'One hundred days on a single habit.',                   equipped: false, achievementId: 'habit_century' },
  { id: 'title_eternal_habit',  name: 'Eternal Habit',        description: 'Three hundred sixty-five days on a single habit.',      equipped: false, achievementId: 'habit_year' },
  // Quest type titles
  { id: 'title_weekly_warrior', name: 'Weekly Warrior',       description: 'Ten weekly quests conquered.',                          equipped: false, achievementId: 'weekly_warrior' },
  { id: 'title_long_player',    name: 'Long Player',          description: 'Five yearly quests completed.',                         equipped: false, achievementId: 'long_player' },
  { id: 'title_life_mission',   name: "Life's Mission",       description: 'Ten life purpose milestones reached.',                  equipped: false, achievementId: 'life_mission' },
  { id: 'title_fulfilled',      name: 'The Fulfilled',        description: 'Twenty-five life purpose milestones.',                  equipped: false, achievementId: 'purpose_legend' },
  // XP titles
  { id: 'title_million_xp',     name: 'XP God',               description: 'One million experience points.',                        equipped: false, achievementId: 'million_xp' },
  // Workout titles
  { id: 'title_iron_will',      name: 'Iron Will',            description: 'Ten sessions of relentless training.',                  equipped: false, achievementId: 'iron_will' },
  { id: 'title_beast_mode',     name: 'Beast Mode',           description: 'Twenty-five sessions. The grind is real.',              equipped: false, achievementId: 'beast_mode' },
  { id: 'title_workout_legend', name: 'Workout Legend',       description: 'Five hundred workout sessions logged.',                  equipped: false, achievementId: 'workout_legend' },
  { id: 'title_cardio_king',    name: 'Cardio King',          description: 'Twenty-five cardio sessions conquered.',                equipped: false, achievementId: 'cardio_king' },
  { id: 'title_cali_warrior',   name: 'Calisthenics Warrior', description: 'Twenty-five calisthenics sessions.',                    equipped: false, achievementId: 'cali_warrior' },
  { id: 'title_iron_monk',      name: 'Iron Monk',            description: 'Fifty gym sessions in the iron temple.',                equipped: false, achievementId: 'iron_monk' },
  { id: 'title_gym_master',     name: 'Gym Master',           description: 'Two hundred and fifty gym sessions.',                   equipped: false, achievementId: 'gym_master' },
  // Log titles
  { id: 'title_chronicler',     name: 'The Chronicler',       description: 'A hundred evaluated daily logs.',                       equipped: false, achievementId: 'chronicler' },
  { id: 'title_legendary_day',  name: 'Legendary',            description: 'Seven hundred XP in a single day.',                    equipped: false, achievementId: 'legendary_day' },
]

export function createInitialPlayer(name: string, statConfig: StatConfig[] = DEFAULT_STAT_CONFIG): Player {
  const emptyStatBlock = (): StatBlock => ({ value: 0, subStats: [] })
  const stats: Record<string, StatBlock> = {}
  for (const cfg of statConfig) stats[cfg.key] = emptyStatBlock()
  return {
    id: generateId(),
    name,
    title: '',
    tier: 'F',
    level: 1,
    xp: 0,
    xpToNext: 100,
    totalXP: 0,
    stats,
    createdAt: new Date().toISOString(),
    statHistory: [],
  }
}
