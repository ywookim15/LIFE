# LIFE App — Improvements Implementation Prompt

Copy everything below this line and hand it to a Claude Code agent working in this repo.

---

## Context & Ground Rules

You are working in a Next.js app (the "LIFE" gamified self-improvement tracker). Before writing ANY Next.js-specific code (routing, API routes, file conventions, metadata, server/client component boundaries), **read `AGENTS.md` at the project root and then consult `node_modules/next/dist/docs/`** — this project runs a modified version of Next.js with breaking changes from the standard APIs you may know. Do not assume standard Next.js conventions apply without checking.

The app uses:
- Zustand for state, persisted to localStorage (`lib/store.ts`, key `lifegame_store`)
- A central type system in `lib/types.ts`
- Shared game logic/helpers in `lib/gameLogic.ts`
- Default seed data in `lib/defaultData.ts`
- Recharts is already a dependency and is used (or about to be used) for radar/line charts
- Framer Motion for animation
- A custom "system terminal" aesthetic: Orbitron font for labels, dark navy/blue color scheme (`#05070f` background, `#1e3a8a` borders, `#93c5fd` highlights), `SystemPanel` wrapper component for boxed sections
- An AI evaluation pipeline via `app/api/evaluate/route.ts` using `@google/generative-ai` (Gemini), driven by `GEMINI_API_KEY`

Implement the 9 improvements below. Treat them as one coordinated overhaul of the data model, store, AI evaluation pipeline, and UI — many items share underlying data model changes (especially the streak/XP/history/debuff changes), so plan the `lib/types.ts` and `lib/store.ts` changes first, then build outward to the UI and API routes.

After implementation, run the dev server and manually verify: creating quests of every type, completing quests, submitting a daily log and running an evaluation, viewing the new Character Summary tab, viewing a habit's heatmap, and confirming debuffs no longer appear anywhere in the UI or data flow.

---

## 1. Character Summary Tab

Add a new top-level page (e.g. `app/character/page.tsx`, route `/character`) and a corresponding entry in `components/Navigation.tsx` (both the desktop sidebar `NAV_ITEMS` list and the mobile bottom bar, which share the same array — add a new item with an appropriate icon, label something like "Character" or "Summary"). Place it logically in the nav order, e.g. between "Skills" and "Log", or after "Status" — use your judgment based on information hierarchy.

This page should have three sub-sections, each its own `SystemPanel`:

### 1a. AI Character Summary
An AI-generated narrative summary of the player as a person: their apparent specialties (which stats/sub-stats they invest the most effort in), behavioral patterns (consistency, time-of-day patterns if inferable from log timestamps, what kinds of quests they gravitate toward vs. avoid), strengths, and growth areas. This should read like a "character profile" in the RPG system's terse, cold, factual voice (consistent with the existing `SYSTEM_PROMPT` tone in `app/api/evaluate/route.ts`).

Implement a new API route, e.g. `app/api/character-summary/route.ts`, following the same pattern as `app/api/evaluate/route.ts` (Gemini client, system prompt, JSON-only response, sanitization of the parsed result). The request body should send: the full `player` object (stats, sub-stats, level, tier, totalXP), the full `quests` array (to analyze types/categories of things the user pursues and completion rates), and a reasonable window of `logs` (e.g. last 30-60 days) including their `aiEvaluation` content where present.

The response JSON should include at minimum: a `summary` string (2-4 paragraphs), a `specialties` array of strings (e.g. "Quantitative Finance", "Strength Training"), and a `weakestStat` (one of the `StatKey` values) with a short explanation of why.

On the page, render this as a readable card — this is one of the few places in the app where longer prose is appropriate, so don't force it into the terse single-line style used elsewhere; use a slightly larger font size and comfortable line height while keeping the existing color palette and Orbitron headers for labels.

Add a "Generate / Refresh Report" button (since this is an AI call with a cost/latency, don't auto-run it on every page visit — let the user trigger it, and cache the last result with a timestamp so it persists across reloads via the Zustand store).

### 1b. Weekly/Monthly "System Report" Retrospective
A second AI-generated block, toggleable between "Weekly" and "Monthly" scope (a small segmented control at the top of this panel). This should summarize:
- Overall trend (improving / plateauing / declining, with reasoning)
- The single weakest stat over the period (lowest XP gained, or lowest sub-stat growth, relative to the others) and what that means
- The 2-3 biggest wins (specific quests completed, streaks maintained, stat jumps, achievements unlocked) in the period

This can reuse the same `character-summary` API route with a `mode` parameter (`'weekly' | 'monthly'`) and a `scope` indicating how many days of `logs`/quest-completion history to send, or it can be a separate route (e.g. `app/api/system-report/route.ts`) if that keeps the prompt cleaner — your call, but keep the JSON response shape consistent with the rest of the app (a `systemMessage`-style terse summary plus structured fields for `trend`, `weakestStat`, `biggestWins` as an array of short strings).

Render this in the established terse "system notification" style (short sentences, factual, similar to `EvaluationResult`'s display of `systemMessage`).

### 1c. "30 Days Ago vs Now" Comparison View
This is primarily a data visualization, not an AI call — it depends on having historical snapshots of the player's stats (see the History Chart requirements in Item 4, which introduces a `statHistory` data structure in the store; build this sub-section to consume that same history data).

For each of the 5 core stats (`INT`, `PHY`, `WLT`, `CHA`, `CRF`), show a compact side-by-side comparison: the stat's value ~30 days ago vs. its current value, the delta (with a `+`/`-` indicator and color: green for increase, red for decrease, gray for no change), and a percentage change. Also show total XP 30 days ago vs now, and player level/tier 30 days ago vs now.

If fewer than 30 days of history exist (new players), fall back gracefully: use the earliest available snapshot and label it accordingly (e.g. "Since [date]" instead of "30 Days Ago"), and show a note that more history will accumulate over time.

Layout this as a simple grid/table of stat rows rather than a chart — the line chart in Item 4 already covers trajectory; this section is about an at-a-glance delta.

---

## 2. Quest Creation / XP Changes

### 2a. Remove manual XP input
In `components/quests/QuestForm.tsx`, remove the entire "XP Reward Hint" field (the `xpReward` state, its input, and its inclusion in `questData`). Also remove or repurpose the `xpReward` field on the `Quest` type in `lib/types.ts` — decide whether to keep it as an AI-populated "estimated XP" field (recommended: rename conceptually to something like `estimatedXP`, set by the AI at creation time or completion time, used for display badges) or remove it entirely and only show actual awarded XP after evaluation via `AIEvaluation`. Update `components/quests/QuestCard.tsx` accordingly — it currently displays `quest.xpReward` as a badge; decide whether this badge should now show an AI-estimated XP value (computed at quest-creation time) or be removed until the quest is evaluated.

### 2b. AI-driven XP determination
When a quest is created (or at minimum, when it is completed), the AI evaluation pipeline should determine XP based on: the quest's `title` and `description` (effort/complexity implied by the text), the quest `type` (habit/today/weekly/yearly/lifePurpose — see Item 6), how long the quest was open (`createdAt` to `completedAt`, or for habits, the cadence), and any quantity/scale cues in the text (e.g. "run 5 miles" vs "run 1 mile", "read 3 chapters").

Implement this by extending `app/api/evaluate/route.ts` (or adding a new route, e.g. `app/api/quest-xp/route.ts`, called when a quest is marked complete via `completeQuest` in `lib/store.ts`) so that completing a quest triggers an AI call that returns a per-quest XP award and stat breakdown, similar in shape to the existing daily-log evaluation (`statBreakdown: [{stat, xp}]`). This means `completeQuest` in `lib/store.ts` likely needs to become async (or trigger a side effect) — plan the store/UI interaction so the user gets feedback (e.g. a "Evaluating..." state on the `QuestCard` while the AI call is in flight, then the XP badge populates once resolved).

Update the `SYSTEM_PROMPT` in `app/api/evaluate/route.ts` (or the new route's prompt) to explicitly instruct the AI on how to scale XP by effort, duration, and quantity — give it guidance bands similar to the existing daily-log XP scale (e.g. quick daily habit completions are worth less than a multi-week yearly quest milestone).

### 2c. Streak bonuses / multipliers
`Quest.streak` already exists and is incremented in `resetDueHabits` in `lib/store.ts` for recurring habit quests. Currently this number is purely cosmetic (displayed on `QuestCard` as "🔥 N day streak"). Implement an XP multiplier based on streak length:

- Define a streak-multiplier curve in `lib/gameLogic.ts` (e.g. a function `getStreakMultiplier(streak: number): number`) — something like 1.0x for streaks under a threshold (e.g. 3 days), scaling up gradually (e.g. +5-10% per week of consecutive completion, capped at a reasonable max like 2x at ~60+ days) to reward long-term consistency without letting it dominate the XP economy.
- Apply this multiplier when a habit quest is completed and awarded XP — multiply the AI-determined base XP (from 2b) by `getStreakMultiplier(quest.streak)` before passing it to `awardXP` in the store.
- Surface the multiplier in the UI: on `QuestCard`, alongside the existing streak badge, show the current multiplier (e.g. "🔥 14 day streak ×1.3") so the incentive is visible.
- Make sure the multiplier is included in the AI reasoning shown per Item 8 (e.g. "Base XP: 40, Streak bonus (×1.3): +12").

---

## 3. Remove Debuffs Entirely

This is a cross-cutting removal. Touch every reference:

- **`lib/types.ts`**: Remove the `Debuff` interface, the `activeDebuffs: Debuff[]` field on `Player`, and the `debuffsApplied`/`debuffsLifted` fields on `AIEvaluation`. Remove the `debuff_cleared` variant from `AchievementCondition`.
- **`lib/store.ts`**: Remove `applyDebuff`, `liftDebuff`, and `clearedDebuffCount` from the store interface and implementation. Remove the debuff-application logic inside `failQuest` (currently calls `applyDebuff` when a habit quest fails — replace with whatever the new "failed habit" consequence should be, if any; the simplest approach is just to leave it as a `failed` status with no penalty, consistent with "remove debuffs entirely" — but you may keep the streak reset to 0, which already happens). Remove the debuff-application/lifting loop inside `updateLogEvaluation`.
- **`app/api/evaluate/route.ts`**: Remove `debuffsApplied`/`debuffsLifted` from the `SYSTEM_PROMPT` instructions and the JSON response schema, and remove them from the `sanitized` object. Update the prompt's numbered instructions (currently steps 5 and 6 reference debuffs) — renumber/rewrite accordingly.
- **`lib/gameLogic.ts`**: Remove the `debuff_cleared` case from `checkAchievements`'s switch statement.
- **`lib/defaultData.ts`**: Remove any default achievements/titles whose `condition.type === 'debuff_cleared'`, and remove `activeDebuffs: []` (or equivalent) from `createInitialPlayer`.
- **Components**: Delete `components/ui/DebuffCard.tsx` and `components/dashboard/ActiveDebuffs.tsx` entirely, and remove the `<ActiveDebuffs />` usage from `app/page.tsx` (dashboard left column).
- **`app/log/page.tsx`**: Remove the `debuffsApplied`/`debuffsLifted` notification logic in `handleEvaluationComplete`.
- **`app/achievements/page.tsx`**: Remove the `debuff_cleared` case from the `conditionText` helper.
- **`components/quests/QuestCard.tsx`**: The `handleFail` notification currently says "DEBUFF APPLIED" — change this message to something appropriate for a debuff-free system (e.g. "HABIT QUEST FAILED. STREAK RESET.").

Search the codebase for any remaining references to `Debuff`, `debuff`, `activeDebuffs`, `clearedDebuffCount`, `applyDebuff`, `liftDebuff`, `debuffsApplied`, `debuffsLifted`, and `debuff_cleared` to make sure nothing is missed, including in `lib/store.ts`'s persisted-state migration logic (`migrateIfNeeded`) — add migration handling so existing users' persisted state (which may contain `activeDebuffs` and `clearedDebuffCount`) doesn't break on load; strip these fields gracefully during rehydration rather than crashing.

---

## 4. History Chart of Stat/XP Growth Over Time

### 4a. Data model: stat history snapshots
Add a new persisted array to the store, e.g. `statHistory: StatSnapshot[]`, where each `StatSnapshot` (new type in `lib/types.ts`) captures a point-in-time record: `{ date: string (YYYY-MM-DD), stats: Record<StatKey, number>, totalXP: number, level: number, tier: Tier }` (store the top-level `value` of each `StatBlock`, not the full sub-stat arrays, to keep this lightweight).

Append a new snapshot to `statHistory` once per day, the first time `awardXP` is called on a given day (check whether the last entry's `date` already equals today's date via `getTodayDate()`; if so, update that entry in place rather than appending a duplicate — this keeps one snapshot per day while still reflecting same-day progress). This guarantees the history accumulates automatically as the player uses the app, without a separate cron/background job.

This same `statHistory` data structure is what powers Item 1c (30-days-ago-vs-now comparison) — reuse it.

### 4b. Line chart component
Create a new component, e.g. `components/dashboard/StatHistoryChart.tsx`, using Recharts' `LineChart`/`ResponsiveContainer`/`Line`/`XAxis`/`YAxis`/`Tooltip`/`CartesianGrid`, following the visual conventions already established (dark background, `#1e3a8a` grid lines, per-stat colors from `getStatColor` in `lib/gameLogic.ts`, Orbitron font for axis labels and tooltips).

Plot one line per `StatKey` (5 lines total, each colored via `getStatColor`), with the X-axis as date (from `statHistory`, formatted via `formatDate`) and Y-axis as stat value (0-999 range, but consider auto-scaling or a fixed sensible range). Include a legend identifying each stat by its color and label (`getStatLabel`).

Add a time-range selector (e.g. "4 Weeks / 12 Weeks / All Time") that filters the `statHistory` array passed to the chart.

Optionally also support a toggle to switch the Y-axis series from "stat values" to "total XP over time" (a single line) — if implemented, this can be a second chart or a mode toggle on the same chart; use your judgment on whether this fits cleanly into one component or warrants two.

### 4c. Placement
Add this chart to a sensible location — either as a new `SystemPanel` section on the main dashboard (`app/page.tsx`, right column, alongside `StatGrid` and "System Log"), or on the Skills page (`app/skills/page.tsx`) near the existing `SkillRadar`, since both are about stat visualization. Given the Character Summary tab (Item 1) already deals with longitudinal comparisons, you may also consider placing it there. Pick one primary location and ensure it's reachable; cross-linking from Character Summary is fine if placed elsewhere.

---

## 5. Questboard Two-Column Layout

In `app/quests/page.tsx`, change the container that currently renders `{SECTIONS.map(...)}` as a single vertical `space-y-4` stack into a responsive two-column grid (e.g. `grid grid-cols-1 lg:grid-cols-2 gap-4`, matching the breakpoint conventions used elsewhere in the app such as `app/page.tsx`'s `lg:grid-cols-[360px_1fr]`). Each `QuestSection` (including the new "Life Purposes" section from Item 6) becomes a grid cell. Decide a sensible pairing/ordering for which sections sit side-by-side — likely: Daily Habits + Today's Objectives in one row, This Week's Targets + This Year's Goals in the next, and Life Purposes spanning full width below (using `lg:col-span-2`) since it's likely to contain the richest content (milestones). Ensure the layout still collapses to a single column on mobile (`grid-cols-1`).

---

## 6. Questboard Renaming + Life Purposes Section

### 6a. Renaming
In `app/quests/page.tsx`, update the `SECTIONS` array's `label` (and adjust `subtitle` copy as needed to match the new framing):
- `today` section: `"Today's Quests"` → `"Today's Objectives"`
- `weekly` section: `"This Week's Quests"` → `"This Week's Targets"`
- `yearly` section: `"This Year's Quests"` → `"This Year's Goals"`

Also update any other UI strings referencing these names (e.g. the "+ ADD ..." button label logic at the bottom of `QuestSection`, which currently has a ternary producing strings like "TODAY'S QUEST", "WEEKLY QUEST", "YEARLY QUEST" — update these to "TODAY'S OBJECTIVE", "WEEKLY TARGET", "YEARLY GOAL"). Also check `app/page.tsx` dashboard, which has a "Daily Objectives" panel showing habit quests — make sure the renaming doesn't create confusing overlap/duplication in terminology; consider whether the dashboard panel title should be adjusted for clarity now that "Objectives" specifically refers to the `today` quest type.

### 6b. New "Life Purposes" section
Add a new `Quest['type']` value: `'lifePurpose'` in `lib/types.ts` (update the union `'habit' | 'today' | 'weekly' | 'yearly' | 'lifePurpose'`). Add a corresponding entry to `SECTIONS` in `app/quests/page.tsx` with label "Life Purposes", a subtitle communicating that these are long-term, beyond-yearly life goals, and a distinct color (pick one not already used by the other four types — `habit: #3b82f6`, `today: #a855f7`, `weekly: #f97316`, `yearly: #fbbf24`; consider something like `#22c55e` or `#06b6d4`). Update `TYPE_COLORS` and `TYPE_LABELS` maps in `components/quests/QuestCard.tsx` and `components/quests/QuestForm.tsx` respectively, and update the quest-type selector grid in `QuestForm` (`grid-cols-4` → `grid-cols-5` to fit the new type, or restructure into two rows of buttons if 5 across is too cramped).

### 6c. Sequential milestones
The `Milestone` type already exists (`{ id, title, completed }`) and `yearly` quests already support a `milestones` array, currently treated as an unordered checklist (any milestone can be toggled independently via `updateMilestone`). For `lifePurpose` quests (and optionally `yearly` too, if it makes sense to extend this behavior), milestones must be **sequential**: only the first incomplete milestone in the array is actionable/togglable; subsequent milestones are visually locked until all prior ones are completed.

Implementation approach:
- In `components/quests/QuestCard.tsx`, when rendering `quest.milestones` for a `lifePurpose` (or extended `yearly`) quest, compute the index of the first incomplete milestone. Render milestones before that index as completed (checked, same as today). Render the milestone at that index as the active/actionable one (clickable checkbox, perhaps with a highlighted border or a "current" badge). Render milestones after that index as locked — visually dimmed/grayed out, with a lock icon instead of a checkbox, and `onClick` disabled.
- `updateMilestone` in `lib/store.ts` can stay generic (toggle a milestone's `completed` flag by id), but the UI should prevent calling it for locked milestones. Consider adding a guard in the store action itself too (reject toggling a milestone if an earlier milestone in the same quest's array is still incomplete) for defense-in-depth.
- In `QuestForm`, extend the milestone-editing UI (currently gated on `type === 'yearly'`) to also apply for `type === 'lifePurpose'`, and clarify in the label/help text that milestone order matters and represents sequential progress.

### 6d. Bigger XP for longer-duration quests
Tie into Item 2b's AI-driven XP system: when the evaluation pipeline determines XP for a completed quest, factor in the quest's `type`/duration tier as a multiplier or baseline shift — e.g. `habit` completions are small, `today` slightly more, `weekly` more still, `yearly` substantial, and `lifePurpose` milestones (each milestone completion, not just final completion) the largest. Encode this guidance explicitly in the AI prompt (Item 2b's system prompt) with rough XP bands per quest type, and/or apply a deterministic multiplier in `lib/gameLogic.ts` (e.g. `getQuestTypeXPMultiplier(type: Quest['type']): number`) that scales the AI's base XP suggestion before it's awarded. For `lifePurpose` quests, since they may not have a single "completion" for a long time, award XP per-milestone (when `updateMilestone` marks a milestone as completed, trigger a smaller AI evaluation or a deterministic XP award scaled by `getQuestTypeXPMultiplier('lifePurpose')` and the milestone's position/weight).

---

## 7. Habit Detail View — GitHub-Style Heatmap

### 7a. Data model: per-habit completion log
Currently, habit quests track only a `streak: number` counter that increments/resets in `resetDueHabits`; there's no historical record of which specific days were completed vs missed. Add a new field to `Quest` in `lib/types.ts`, e.g. `completionLog?: { date: string; status: 'completed' | 'failed' | 'skipped' }[]` (only meaningful for `type === 'habit'`).

Update `resetDueHabits` in `lib/store.ts`: whenever a habit quest transitions from `completed` or `failed` back to `active` for the new day (the existing reset logic), append an entry to `completionLog` for the day that just ended, recording whether it was `completed` or `failed`. Backfill is not required for existing data — the log simply starts accumulating from when this change ships (document this in a comment).

### 7b. Habit detail view / route
Make each habit `QuestCard` (where `quest.type === 'habit'`) clickable to open a detail view showing the heatmap. Implement this either as:
- A modal/overlay component (similar pattern to how `QuestForm` opens as a fixed-position overlay), e.g. `components/quests/HabitDetailView.tsx`, opened via a click handler on the habit `QuestCard` (be careful not to conflict with the existing COMPLETE/FAIL/Edit/Delete buttons — clicking the card body/title opens the detail view, while the action buttons retain their current behavior; use `stopPropagation` as needed), **or**
- A dedicated dynamic route, e.g. `app/quests/[id]/page.tsx`, navigated to via `next/link` from the habit card.

Given the AGENTS.md warning about this being a non-standard Next.js version, check `node_modules/next/dist/docs/` for the correct dynamic route file convention before choosing the routing approach — if dynamic routes are unsupported or different in this version, prefer the modal approach.

### 7c. Heatmap component
Create `components/quests/HabitHeatmap.tsx`: a GitHub-contributions-style grid where each cell represents one day, colored by `completionLog` status (e.g. bright green/`#4fffb0` for completed, red/`#ef4444` or dim for failed, dark gray/`#1e3a8a` for no data / not yet tracked / before quest creation). Lay out as columns of weeks (7 rows = days of week, columns = weeks), spanning a configurable range (default last ~12-16 weeks, matching common GitHub heatmap density), with month labels along the top and day-of-week labels along the side, consistent with the app's Orbitron/system-terminal styling (small font sizes, `#64748b`/`#374151` label colors).

Include a hover tooltip per cell showing the exact date and status (reuse the tooltip pattern from `SkillRadar.tsx`'s vertex tooltips for visual consistency — small bordered box with Orbitron text).

Below or beside the heatmap, show summary stats: current streak (`quest.streak`), longest streak (computed from `completionLog`), and total completions — this is the section that "visually reinforces the Consistent achievement" referenced in `lib/defaultData.ts`'s achievement definitions (find the achievement with `condition.type === 'daily_streak'` titled something like "Consistent" and consider showing its progress/threshold here too).

---

## 8. AI Reasoning Transparency Alongside XP Breakdown

Extend `AIEvaluation` in `lib/types.ts`: change `statBreakdown: { stat: StatKey; xp: number }[]` to `statBreakdown: { stat: StatKey; xp: number; reasoning: string }[]` — each entry now carries a short explanation of *why* that stat received that XP amount.

Update the `SYSTEM_PROMPT` and JSON response schema in `app/api/evaluate/route.ts` (and the new quest-completion evaluation route from Item 2b, if separate) to require a `reasoning` string per stat-breakdown entry — instruct the model to be specific (e.g. reference what the player actually did that justifies the XP for that stat, in 1 sentence, same terse cold tone as `systemMessage`). Update the `sanitized` object's validation to handle this new field (default to an empty string if missing, but encourage the model strongly enough that it's reliably populated).

In `components/log/EvaluationResult.tsx`, update the rendering of `statBreakdown` (find where it currently lists `{stat, xp}` pairs — likely as small badges or a list) to show each stat's `reasoning` text alongside its XP value, e.g. as a sub-line beneath each stat badge, styled consistently with other secondary text in the app (`text-[11px] text-[#64748b]`). If the streak multiplier (Item 2c) applies, show that as part of the reasoning text or as a separate annotation (e.g. "Base: 20 XP · Streak ×1.3 → 26 XP").

If quest-completion XP (Item 2b) is evaluated separately from the daily log, ensure its result is also displayed somewhere with the same reasoning-per-stat treatment — likely inline on the `QuestCard` itself once evaluation resolves (e.g. an expandable "Why?" disclosure under the XP badge).

---

## 9. Skill Radar Fill Fix (Skills & Sub-Skills Radars)

Both `components/skills/SkillRadar.tsx` (the main 5-stat radar with per-sector sub-stat vertices) and `components/skills/SubStatRadar.tsx` (the per-stat sub-stat web chart) currently render a single filled polygon (`<motion.path d={polygonPath} fill="..." stroke="..." />`) representing the *current* values. The user's complaint is that the "filled in" area representing achieved levels/improvements isn't rendering with enough visual weight — it should look like a solid, saturated, color-coded fill showing what's "leveled up" / achieved, not a faint outline.

For **`SkillRadar.tsx`**: the current fill is a flat `rgba(59, 130, 246, 0.15)` (very faint blue) regardless of which stat's sub-stats are plotted, with `stroke="#3b82f6"` at `strokeWidth={1.5}`. Since vertices belong to different stats/sectors (each with its own color via `getStatColor`), consider either: (a) increasing the overall fill opacity substantially (e.g. to ~0.35-0.45) and increasing `strokeWidth` (e.g. to 2-2.5) so the achieved area reads as clearly "filled in," and/or (b) rendering the fill as a multi-color effect — e.g. a radial/conic gradient `<defs>` block keyed by each stat's color at its sector's angular range, so each sector of the filled polygon visually matches that stat's color rather than uniform blue. Given SVG gradient complexity, the simplest robust fix that satisfies "thicker/more saturated color inside the circle for achieved levels" is: increase fill opacity and stroke width as in (a), and additionally render small filled-color "achievement wedges" — e.g. for each stat sector, draw a secondary filled arc/path from the center out to each vertex's radius using `getStatColor(stat)` at moderate opacity (~0.25-0.3), layered beneath the main polygon, so each sector visibly shows its own stat color filled in proportional to its sub-stat values. Use your judgment on the cleanest implementation, but the end result must be: a viewer can see, per-sector, a saturated color fill whose extent corresponds to the sub-stat values in that sector — not just a single faint blue blob.

For **`SubStatRadar.tsx`**'s `WebChart`: the current fill is `${color}33` (≈20% opacity) with `strokeWidth={1.5}`. Increase the fill opacity (e.g. to `${color}55` or `${color}66`, roughly 33-40%) and increase `strokeWidth` (e.g. to 2) so the filled area reads as more saturated/prominent — this chart already uses per-stat `color` correctly, so this is primarily an opacity/stroke-weight tuning fix rather than a structural one. Also double check the `BarChart` fallback (used when `subStats.length < 3`) renders its progress bars with sufficiently saturated `backgroundColor: color` (it currently does — just verify after the radar fix that both code paths feel visually consistent in saturation).

After making these changes, visually verify on `app/skills/page.tsx` with a player that has sub-stats at varying values (including some near 100) across multiple stats, to confirm the fills are clearly visible and color-differentiated per stat, and that the achievement/level-up visual reinforcement the user wants is actually legible at a glance.

---

## Suggested Implementation Order

1. `lib/types.ts` changes for all items (Quest type additions, Milestone/lifePurpose, StatSnapshot, AIEvaluation.statBreakdown.reasoning, Debuff removal, completionLog) — get the data model right first since everything else depends on it.
2. `lib/store.ts` and `lib/gameLogic.ts` updates (debuff removal, statHistory snapshotting, streak multiplier, quest-type XP multiplier, sequential milestone guard).
3. `lib/defaultData.ts` cleanup (remove debuff-related achievements/defaults).
4. `app/api/evaluate/route.ts` updates (remove debuffs, add reasoning, XP scaling guidance) + new routes for quest-completion XP (Item 2b) and character summary / system report (Item 1).
5. Questboard UI (Items 5, 6): layout, renaming, Life Purposes section, sequential milestone UI, QuestForm updates (remove XP field, add lifePurpose type).
6. Habit heatmap (Item 7).
7. AI reasoning display (Item 8) in `EvaluationResult` and `QuestCard`.
8. Skill radar fill fixes (Item 9).
9. History chart (Item 4).
10. Character Summary tab + nav entry (Item 1), last since it consumes data from several of the above (statHistory, achievements, logs, quests).

Throughout, preserve the existing visual language (Orbitron fonts, dark navy palette, `SystemPanel` wrapper, terse cold "System" voice for AI-generated text) and ensure `lib/store.ts`'s persisted-state migration (`migrateIfNeeded`) handles all schema changes gracefully for users with existing localStorage data — old fields should be stripped/defaulted rather than causing runtime errors on load.
