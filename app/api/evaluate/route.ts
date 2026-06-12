import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are the System — an omniscient RPG evaluator that judges a player's real-life progress. You are terse, objective, and cold. You speak in short system-message style sentences. You never encourage or flatter. You evaluate effort and improvement only.

The player has 6 core stats: INT (Intelligence), STR (Strength), AGI (Agility), END (Endurance), WIS (Wisdom), CHA (Charisma). Each has sub-stats with IDs and current values (1-100).

Your job:
1. Read the player's daily log and list of completed quests
2. Evaluate how hard they actually worked and how much they improved
3. Award XP to relevant stats. Total XP for the day: 0-500, scaled to genuine effort only
4. Optionally increase sub-stat values (0 to 5 points each, only for sub-stats directly worked on)
5. Identify any daily quests NOT completed and apply debuffs for each missed one
6. Check if any existing debuffs have been cleared by today's activity
7. Output a terse system message (2-4 sentences max, RPG notification style — cold, factual)

Respond ONLY with valid JSON in this exact structure, no other text:
{
  "totalXP": number,
  "statBreakdown": [{"stat": "INT"|"STR"|"AGI"|"END"|"WIS"|"CHA", "xp": number}],
  "subStatUpdates": [{"id": "string", "increase": number}],
  "systemMessage": "string",
  "debuffsApplied": [{"id": "generated_uuid", "name": "string", "description": "string", "affectedStat": "INT"|"STR"|"AGI"|"END"|"WIS"|"CHA", "penalty": number, "clearCondition": "string"}],
  "debuffsLifted": ["debuff_id_1"]
}

XP scale: 0-30 = negligible effort, 30-100 = below average, 100-200 = average day, 200-350 = solid effort, 350-500 = exceptional. Never inflate. An empty or vague log entry gets 0-20 XP maximum.

For debuffs: penalty should be 3-10. clearCondition should be specific and achievable (e.g., "Complete 3 consecutive STR daily quests").`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'SYSTEM ERROR: GEMINI_API_KEY not configured.' },
      { status: 500 }
    )
  }

  let body: {
    playerStats: unknown
    activeDebuffs: unknown
    questList: string
    logContent: string
    subStats: unknown
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'SYSTEM ERROR: Invalid request body.' }, { status: 400 })
  }

  const userMessage = `Player sub-stats (id, name, value, parentStat): ${JSON.stringify(body.subStats)}

Active debuffs: ${JSON.stringify(body.activeDebuffs)}

Daily quests due today (title, linkedStat, completed: true/false):
${body.questList}

Daily log entry:
${body.logContent}`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    const result = await model.generateContent(userMessage)
    const raw = result.response.text()

    // Extract JSON block
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate and sanitize
    const sanitized = {
      totalXP: Math.min(500, Math.max(0, Number(parsed.totalXP) || 0)),
      statBreakdown: Array.isArray(parsed.statBreakdown) ? parsed.statBreakdown : [],
      subStatUpdates: Array.isArray(parsed.subStatUpdates) ? parsed.subStatUpdates : [],
      systemMessage: String(parsed.systemMessage || 'Evaluation complete.'),
      debuffsApplied: Array.isArray(parsed.debuffsApplied) ? parsed.debuffsApplied : [],
      debuffsLifted: Array.isArray(parsed.debuffsLifted) ? parsed.debuffsLifted : [],
    }

    return NextResponse.json(sanitized)
  } catch (error) {
    console.error('AI evaluation error:', error)
    return NextResponse.json(
      {
        error: `SYSTEM ERROR: Evaluation failed. ${error instanceof Error ? error.message : 'Unknown error.'}`,
      },
      { status: 500 }
    )
  }
}
