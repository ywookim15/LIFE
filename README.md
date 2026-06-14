# LifeGame — RPG Self-Improvement System

A gamified self-improvement tracker built as a full-stack Next.js application. Your real life becomes a role-playing game: complete quests, earn XP, level up stats, and get AI-evaluated daily reports from the System.

---

## Features

### Character System
- **Customizable Core Stats**: default INT / PHY / WLT / CHA / CRF — add, rename, recolor, or delete any stat in Settings
- **Sub-skills** under each stat — fully customizable, tracked individually with progress bars
- **Tier progression**: F → E → D → C → B → A → S → S+ → X — levels are **continuous** (F = 1–100, E = 101–200, … X = 801+); no level reset between tiers
- **XP & Leveling**: flat **100 XP per level**, always. Earn XP through quests and daily evaluations
- **Tier X Prestige**: reaching level 801 triggers a prestige — level resets to 1 and XP to 0 while Tier X is locked in forever; levels then continue to infinity
- **Tier Progress Popup**: click your character avatar on the dashboard to open a horizontal scrollable number line showing every level and tier boundary, color-coded all the way to X
- **Achievements**: **100 achievements** across tiers, quests, habits, streaks, workouts (gym / calisthenics / cardio), sub-stats, total XP, daily logs, and party size — each with graduated thresholds
- **Titles**: 43 unlockable titles; at Tier X you may set a fully **custom title** (any text up to 30 characters)
- **Stat History**: automatic daily snapshots, 30-day comparison chart
- **Character Analysis**: AI-generated character assessment, weekly trajectory, and tactical directive

### Quest Board
- **5 Quest Types**: Habit (daily recurring), Today (one-time daily), Weekly, Yearly, Life Purpose (sequential milestones)
- **Automatic XP on completion**: base XP scales by quest type; habits gain a streak multiplier (up to ×1.5 at 30-day streaks)
- **Unlock from history**: accidentally completed a quest? Unlock it from the history tab — XP is reversed automatically
- **Habit Heatmap**: GitHub-style 12-week completion history per habit
- **Streak tracking**: maintained automatically on daily habit reset; prevents double-completion on reload
- **Sequential milestones**: for Yearly and Life Purpose quests

### Body Tracking
- **Exercise Types**: every exercise is tagged as **Gym** (weight × reps), **Calisthenics** (reps only), or **Cardio** (distance in km + duration in min:sec)
- **Workout Plans**: create named plans with type-aware exercises, muscle group tags; edit or delete existing plans; drag ▲/▼ to reorder
- **Workout Logger**: type-aware input columns per exercise — cardio shows km + split-time inputs; calisthenics shows reps only; gym shows weight + reps
- **3D Muscle Map**: interactive body model with CSS 3D perspective — drag to rotate 360°, or click Front/Back; muscles colored by soreness level
- **Smart Soreness**: calculated from total sets per session, decaying over 72 hours
- **Muscle Strength Radar**: relative-to-self normalization — your strongest muscle = 100%; shows personal muscle balance, not external benchmarks
- **Records Tab**: three sections — Gym 1RM records, Calisthenics max-reps records, Cardio pace records per standard distance (100m → 5K)
- **XP targeting**: gym sets → strength sub-stats; calisthenics sets → calisthenics sub-stats; cardio sets → cardiovascular/endurance sub-stats
- **Session Log**: recent sessions expandable — click any row to reveal all exercises, sets, and type-specific metrics
- **Volume Stats**: total volume, 7-day volume, average per session

### Calendar
- Visual month-grid calendar showing quests and custom events by color
- Click any day to see full event details in a bottom panel
- Multi-day event support with start/end markers

### AI Evaluation System
- Submit a daily activity log → Gemini evaluates effort → XP awarded across stats
- Per-stat reasoning shown in the evaluation result
- Sub-stat increases (0–5 pts) for directly worked skills
- Cold, factual system-message style responses

### Skill Web
- Pentagonal skill radar for core stats
- Sub-stat spider chart and list per skill
- Stat history line chart (last 30 days)

### Cloud & Auth (Supabase)
- Email/password authentication
- All data stored in Supabase Postgres — auto-synced after every change (500 ms debounce + keepalive flush on page hide/unload so data survives tab close)
- Sign out and Delete account (full data wipe) in Settings

### Display & Customization (Settings)
- **Dark / Light mode** toggle — comprehensive light mode with readable text across all components
- **Change Password**: update password in-place without an email reset link (requires being logged in)
- **Skills Configuration**: add, rename, recolor, delete core skills inline
- **Player Identity**: change display name
- **Danger Zone**: reset game data (keeps quests, plans, calendar, skills — clears XP/history) or delete account

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Framer Motion |
| State | Zustand v5 |
| Auth & DB | Supabase (PostgreSQL + Auth) |
| AI | Google Gemini 2.0 Flash |
| Charts | Recharts |
| Deploy | Vercel |

---

## Local Development

### 1. Clone and install

```bash
git clone <your-repo-url>
cd LIFE
npm install
```

### 2. Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GEMINI_API_KEY=AIzaSy...
```

**Never commit `.env.local`.** It is already in `.gitignore`.

### 3. Complete Supabase setup (see below)

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Setup

### Step 1 — Create a project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it (e.g. `lifegame`), set a database password, pick a region
3. Wait ~2 minutes for provisioning

### Step 2 — Get API keys

**Project Settings → API**:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role / secret** key → `SUPABASE_SERVICE_ROLE_KEY` *(server-side only — keep secret)*

### Step 3 — Run the SQL migration

**SQL Editor** in your Supabase dashboard — paste and run:

```sql
CREATE TABLE IF NOT EXISTS player_data (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  data        JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE player_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own data"
ON player_data FOR ALL
USING  (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Step 4 — (Optional) Disable email confirmation for testing

**Authentication → Settings → Email** → toggle off **Enable email confirmations**. Re-enable for production.

### Step 5 — Add keys to `.env.local` and restart

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "initial deployment"
git push origin main
```

### 2. Import in Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import your repo
2. Framework: **Next.js** (auto-detected)
3. Click **Deploy** (first build may fail — add env vars next)

### 3. Add environment variables

**Vercel Project → Settings → Environment Variables**:

| Key | Environments |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development |
| `GEMINI_API_KEY` | Production, Preview, Development |

### 4. Add your Vercel domain to Supabase

**Supabase → Authentication → URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/**`

### 5. Redeploy

Push a commit or click **Redeploy** in Vercel. The app is now live.

---

## Environment Variables Reference

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase Project Settings → API (secret) |
| `GEMINI_API_KEY` | ✅ | [aistudio.google.com](https://aistudio.google.com) — free tier available |

---

## Architecture

```
app/
├── layout.tsx              Root layout + metadata
├── providers.tsx           Auth gate, cloud sync, modals, notifications
├── page.tsx                Dashboard (CharacterCard + StatGrid + tier popup)
├── quests/page.tsx         Quest board (5 types, two-column grid, unlock from history)
├── body/page.tsx           Body tracking — plans, logger, 3D model, records, log
├── log/page.tsx            Daily log + AI evaluation + retry
├── calendar/page.tsx       Monthly calendar with quest/event overlay
├── skills/page.tsx         Stat & sub-stat management
├── character/page.tsx      AI analysis + 30-day stat history
├── achievements/page.tsx   Achievement tracker
├── party/page.tsx          Party members
├── settings/page.tsx       Display (theme + font), password, skills config, danger zone
└── api/
    ├── evaluate/           POST — Gemini evaluates daily log → XP
    ├── character-summary/  POST — Gemini generates character report
    └── delete-account/     DELETE — server-side account deletion

lib/
├── types.ts                All TypeScript types (Player, Quest, WorkoutLog, CalendarEvent…)
├── store.ts                Zustand store — quests, XP, workouts, calendar, manualPRs…
├── gameLogic.ts            XP math, tier logic, localDateStr(), achievement checks
├── defaultData.ts          Initial achievements, titles, player template
└── supabase.ts             Supabase client singleton

contexts/
├── AuthContext.tsx         Auth state + sign in/up/out/delete
├── ThemeContext.tsx        Dark/light mode + font preference (10 options, localStorage)
└── NotificationContext.tsx Toast notification system

hooks/
└── useCloudSync.ts         500 ms debounce Supabase save + keepalive flush on page hide

components/
├── auth/AuthScreen.tsx     Full-screen login/signup UI
├── body/
│   ├── BodyModel.tsx       3D rotating muscle map (CSS perspective + drag)
│   ├── MuscleRadar.tsx     Radar with per-muscle strength benchmarks
│   ├── WorkoutCalendar.tsx Monthly workout frequency heatmap
│   └── ExerciseProgressChart.tsx  1RM trend per exercise
├── quests/                 QuestCard (unlock/history), QuestForm, HabitHeatmap
├── log/                    LogEditor, EvaluationResult
├── skills/                 SkillRadar, SubStatRadar, SubStatList
├── charts/                 StatHistoryChart
├── dashboard/              CharacterCard (tier popup via portal), StatGrid
└── ui/                     SystemPanel, XPBar, TierBadge, LevelUpModal, etc.
```

### Data flow

```
Sign in
  └─ AuthContext → fetch player_data from Supabase
       └─ loadGameState() → resetDueHabits() → populate Zustand store
            └─ Components read from Zustand (fast/sync)
                 └─ Any change → useCloudSync → upsert to Supabase (500 ms debounce)
                      └─ Page hide/beforeunload → keepalive fetch (survives tab close)

Sign out
  └─ AuthContext → resetGame() → AuthScreen shown
```

---

## Quest XP Reference

| Quest Type | Base XP | Streak Bonus |
|---|---|---|
| Habit | 50 | ×1.1 at 3d / ×1.2 at 7d / ×1.3 at 14d / ×1.5 at 30d |
| Today | 75 | — |
| Weekly | 150 | — |
| Yearly | 300 | — |
| Life Purpose | 500 | — |

AI evaluation awards an additional 0–500 XP per daily log entry, split across stats and sub-stats.

Workout XP targets specific PHY sub-stats by exercise type keyword (gym → "strength", calisthenics → "calisthenics", cardio → "cardiovascular"/"endurance").

Unlocking a completed quest via the history tab automatically reverses the XP awarded.

---

## Achievement Categories (100 Total)

| Category | Count | Example milestones |
|---|---|---|
| Tier progression | 9 | Awakened (E) → Transcendent (S) → Unbounded (X) |
| Specialist (sub-stat) | 6 | 10 → 25 → 50 → 100 → 500 → 1000 → 2500 |
| Polymath (multi sub-stat) | 6 | 3 above 30 → 5 above 50 → 5 above 100 |
| Daily streak | 7 | 7 → 14 → 30 → 60 → 90 → 180 → 365 days |
| Quest count | 7 | 1 → 10 → 25 → 50 → 100 → 250 → 500 → 1000 |
| Habit completions | 5 | 10 → 50 → 100 → 365 → 1000 |
| Habit streaks | 4 | 7 → 30 → 100 → 365 days (per habit) |
| Quest type (today/weekly/yearly/LP) | 12 | Type-specific milestones |
| Total XP | 6 | 1K → 5K → 25K → 100K → 500K → 1M |
| Workout volume | 7 | 1 → 10 → 25 → 50 → 100 → 250 → 500 sessions |
| Cardio sessions | 5 | 1 → 10 → 25 → 50 → 100 |
| Calisthenics sessions | 4 | 1 → 10 → 25 → 50 |
| Gym sessions | 5 | 1 → 10 → 50 → 100 → 250 |
| Manual PRs | 3 | 1 → 5 → 20 |
| Daily XP peaks | 3 | 200 → 500 → 700 XP in one eval |
| Evaluated log count | 5 | 1 → 10 → 50 → 100 → 365 |
| Party | 3 | 1 → 3 → 5 members |
