import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are the System — an omniscient RPG narrator that generates a cold, clinical character profile report. You are terse, analytical, and speak in system-log style. No flattery. No encouragement. Only facts and assessments.

Your report has three sections:
1. CHARACTER ASSESSMENT — 3-5 sentences. Describe the player's current archetype, dominant traits, and behavioral patterns based on their stats and activity. Be specific to their actual numbers.
2. WEEKLY TRAJECTORY — 2-3 sentences. Analyze the last 7 days of progress. What moved? What stagnated? What declined?
3. SYSTEM DIRECTIVE — 1-2 sentences. One cold, actionable directive based on the weakest vector. Not motivational. Tactical.

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "characterAssessment": "string",
  "weeklyTrajectory": "string",
  "systemDirective": "string"
}`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'SYSTEM ERROR: GROQ_API_KEY not configured.' },
      { status: 500 }
    )
  }

  let body: {
    playerName: string
    tier: string
    level: number
    totalXP: number
    stats: Record<string, { value: number; subStats: { name: string; value: number }[] }>
    recentLogs: { date: string; xpAwarded: number; systemMessage: string }[]
    statHistory30d: { date: string; stats: Record<string, number> }[]
    activeQuests: { title: string; type: string; linkedStat: string; streak?: number }[]
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'SYSTEM ERROR: Invalid request.' }, { status: 400 })
  }

  const statSummary = Object.entries(body.stats)
    .map(([k, v]) => `${k}: ${v.value} (${v.subStats.length} sub-stats)`)
    .join(', ')

  const recentActivity = body.recentLogs.slice(-7)
    .map(l => `[${l.date}] +${l.xpAwarded} XP — ${l.systemMessage}`)
    .join('\n') || 'No recent activity.'

  const questList = body.activeQuests.slice(0, 10)
    .map(q => `${q.type.toUpperCase()} | ${q.linkedStat} | ${q.title}${q.streak ? ` (streak: ${q.streak})` : ''}`)
    .join('\n') || 'No active quests.'

  const historyNote = body.statHistory30d.length >= 2
    ? `30-day stat trajectory available: ${body.statHistory30d.length} data points.`
    : 'Limited history data.'

  const userMessage = `Player: ${body.playerName} | Tier ${body.tier} Level ${body.level} | Total XP: ${body.totalXP}

Current Stats: ${statSummary}

${historyNote}

Recent logs (last 7 days):
${recentActivity}

Active Quests:
${questList}`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Groq API error ${response.status}: ${err}`)
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content ?? ''

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({
      characterAssessment: String(parsed.characterAssessment || ''),
      weeklyTrajectory: String(parsed.weeklyTrajectory || ''),
      systemDirective: String(parsed.systemDirective || ''),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Character summary error:', error)
    return NextResponse.json(
      { error: `SYSTEM ERROR: ${error instanceof Error ? error.message : 'Unknown error.'}` },
      { status: 500 }
    )
  }
}
