# LifeGame — RPG Self-Improvement System

A gamified self-improvement tracker built as a full-stack Next.js application. Your real life becomes a role-playing game: complete quests, earn XP, level up stats, and get AI-evaluated daily reports from the System.

---

## Features

### Character System
- **5 Core Stats**: INT (Intelligence), PHY (Physical), WLT (Wealth), CHA (Charisma), CRF (Craft)
- **Sub-skills** under each stat — fully customizable, tracked individually
- **Tier progression**: F → E → D → C → B → A → S, each tier unlocking new thresholds
- **XP & Leveling**: earn XP through quests and daily evaluations; level up within tiers
- **Titles & Achievements**: unlock achievements and equip titles to your profile
- **Stat History**: automatic daily snapshots, 30-day comparison chart
- **Character Analysis**: AI-generated character assessment, weekly trajectory, and tactical directive

### Quest Board
- **5 Quest Types**: Habit (daily recurring), Today (one-time daily), Weekly, Yearly, Life Purpose (sequential milestones)
- **Automatic XP on completion**: base XP scales by quest type; habits gain a streak multiplier (up to ×1.5 at 30-day streaks)
- **Habit Heatmap**: GitHub-style 12-week completion history per habit
- **Streak tracking**: maintained automatically on daily habit reset
- **Sequential milestones**: for Yearly and Life Purpose quests

### AI Evaluation System (Google Gemini)
- Submit a daily activity log → Gemini evaluates effort → XP awarded across stats
- Per-stat reasoning shown in the evaluation result
- Sub-stat increases (0–5 pts) for directly worked skills
- Cold, factual system-message style responses

### Skill Radar & Charts
- Pentagonal skill radar with per-sector color fills
- Sub-stat spider chart per skill
- Stat history line chart (last 30 days)

### Cloud & Auth (Supabase)
- Email/password authentication
- All data stored in Supabase Postgres — auto-synced after every change (1.5s debounce)
- Sign out and Delete account (full data wipe) in Settings
- New users get an onboarding flow to name their character

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
├── page.tsx                Dashboard
├── quests/page.tsx         Quest board (5 types, two-column grid)
├── log/page.tsx            Daily log + AI evaluation + retry
├── skills/page.tsx         Stat & sub-stat management
├── character/page.tsx      AI analysis + 30-day stat history
├── achievements/page.tsx   Achievement tracker
├── party/page.tsx          Party members
├── settings/page.tsx       Name, sign out, delete account
└── api/
    ├── evaluate/           POST — Gemini evaluates daily log → XP
    ├── character-summary/  POST — Gemini generates character report
    └── delete-account/     DELETE — server-side account deletion

lib/
├── types.ts                All TypeScript types
├── store.ts                Zustand store (in-memory state only)
├── gameLogic.ts            XP math, tier logic, achievement checks
├── defaultData.ts          Initial achievements, titles, player template
└── supabase.ts             Supabase client singleton

contexts/
├── AuthContext.tsx         Auth state + sign in/up/out/delete
└── NotificationContext.tsx Toast notification system

hooks/
└── useCloudSync.ts         Debounced Supabase save on any store change

components/
├── auth/AuthScreen.tsx     Full-screen login/signup UI
├── quests/                 QuestCard, QuestForm, HabitHeatmap
├── log/                    LogEditor, EvaluationResult
├── skills/                 SkillRadar, SubStatRadar
├── charts/                 StatHistoryChart
├── dashboard/              CharacterCard, StatGrid
└── ui/                     SystemPanel, XPBar, TierBadge, LevelUpModal, etc.
```

### Data flow

```
Sign in
  └─ AuthContext → fetch player_data from Supabase
       └─ loadGameState() → populate Zustand store
            └─ Components read from Zustand (fast/sync)
                 └─ Any change → useCloudSync → upsert to Supabase (1.5s debounce)

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

AI evaluation awards an additional 0–500 XP per daily log entry, split across stats.
